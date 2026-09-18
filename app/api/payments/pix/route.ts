import { NextResponse } from "next/server";
import {
  createPixCharge,
  normalizePixAction,
  XPaymentsError,
  type ShippingAddress,
} from "@/lib/xpayments";
import {
  CommerceError,
  createOrderReference,
  createPendingOrder,
  markOrderPaymentFailed,
  recordPendingPayment,
} from "@/lib/commerce";
import { getBrlShippingCents, XPAYMENTS_STORES } from "@/lib/checkout-config";
import { variants, type VariantId } from "@/lib/products";
import {
  isValidBrazilPhone,
  isValidCep,
  isValidTaxId,
  onlyDigits,
} from "@/lib/validators";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readShipping(value: any): ShippingAddress {
  return {
    cep: onlyDigits(value?.cep).slice(0, 8),
    street: String(value?.street || "").trim().slice(0, 160),
    number: String(value?.number || "").trim().slice(0, 30),
    complement: String(value?.complement || "").trim().slice(0, 80),
    neighborhood: String(value?.neighborhood || "").trim().slice(0, 120),
    city: String(value?.city || "").trim().slice(0, 120),
    state: String(value?.state || "").trim().toUpperCase().slice(0, 2),
  };
}

export async function POST(request: Request) {
  let reference = "";

  try {
    const body = await request.json().catch(() => ({}));
    const variant = String(body?.variant || "") as VariantId;

    if (!variants[variant]) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_VARIANT", message: "Produto inválido." },
        },
        { status: 400 },
      );
    }

    const shippingCents = getBrlShippingCents();

    if (shippingCents === null) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SHIPPING_NOT_CONFIGURED",
            message:
              "A política de frete do Brasil ainda não foi configurada. A compra não foi criada.",
          },
        },
        { status: 503 },
      );
    }

    const name = String(body?.customer?.name || "")
      .trim()
      .replace(/\s+/g, " ");
    const email = String(body?.customer?.email || "").trim().toLowerCase();
    const document = onlyDigits(body?.customer?.document);
    const phone = onlyDigits(body?.customer?.phone);
    const shipping = readShipping(body?.shipping);

    if (name.length < 3 || !name.includes(" ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NAME_REQUIRED",
            message: "Informe o nome completo.",
          },
        },
        { status: 400 },
      );
    }

    if (!validEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_INVALID",
            message: "Informe um e-mail válido.",
          },
        },
        { status: 400 },
      );
    }

    if (!isValidTaxId(document)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DOCUMENT_INVALID",
            message: "Informe um CPF ou CNPJ válido.",
          },
        },
        { status: 400 },
      );
    }

    if (!isValidBrazilPhone(phone)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PHONE_INVALID",
            message: "Informe um telefone brasileiro válido com DDD.",
          },
        },
        { status: 400 },
      );
    }

    if (
      !isValidCep(shipping.cep) ||
      !shipping.street ||
      !shipping.number ||
      !shipping.neighborhood ||
      !shipping.city ||
      !/^[A-Z]{2}$/.test(shipping.state)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SHIPPING_INVALID",
            message: "Confira o endereço de entrega.",
          },
        },
        { status: 400 },
      );
    }

    const allowedAttribution = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ];

    const attribution: Record<string, string> = {};
    const rawAttribution =
      body?.attribution && typeof body.attribution === "object"
        ? body.attribution
        : {};

    for (const key of allowedAttribution) {
      const value = rawAttribution[key];

      if (typeof value === "string" && value.trim()) {
        attribution[key] = value.trim().slice(0, 180);
      }
    }

    reference = createOrderReference(variant);

    // Commerce Core creates the order first and resolves the server-side price.
    const order = await createPendingOrder({
      variant,
      reference,
      customer: { name, email, document, phone },
      shipping,
      shippingCents,
      attribution,
    });

    let payload: any;

    try {
      payload = await createPixCharge({
        variant,
        reference: order.reference,
        customer: { name, email, document, phone },
        shipping,
        shippingCents: order.shippingCents,
        amountCents: order.totalCents,
        sku: order.sku,
        edition: order.edition,
        attribution,
      });
    } catch (error) {
      await markOrderPaymentFailed(order.reference);
      throw error;
    }

    const pix = normalizePixAction(payload);

    if (!pix.copyPaste) {
      await markOrderPaymentFailed(order.reference);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PIX_QR_MISSING",
            message:
              "O PIX foi criado, mas o código de pagamento não foi recebido.",
          },
        },
        { status: 502 },
      );
    }

    try {
      await recordPendingPayment({
        order,
        transactionId: pix.transactionId,
        providerPayload: {
          transactionId: pix.transactionId,
          reference: pix.reference,
          status: pix.status,
          expiresAt: pix.expiresAt,
        },
      });
    } catch (error) {
      // A valid PIX already exists. Do not hide it from the customer because a
      // secondary persistence step failed; XPAYMENTS + order reference allow reconciliation.
      console.error("[SIGNUM_PAYMENT_RECORD_ERROR]", error);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...pix,
        variant,
        orderId: order.orderId,
        subtotal: order.subtotalCents / 100,
        shipping: order.shippingCents / 100,
        amount: order.totalCents / 100,
        currency: "BRL",
        store: XPAYMENTS_STORES.BRL,
      },
    });
  } catch (error) {
    if (error instanceof CommerceError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status: error.status },
      );
    }

    if (error instanceof XPaymentsError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status: error.status },
      );
    }

    console.error("[SIGNUM_PIX_CREATE_ERROR]", {
      reference: reference || undefined,
      error,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PIX_CREATE_FAILED",
          message: "Não foi possível gerar o PIX agora. Tente novamente.",
        },
      },
      { status: 500 },
    );
  }
}
