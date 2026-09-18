import { NextResponse } from "next/server";
import {
  createPixCharge,
  normalizePixAction,
  XPaymentsError,
  type ShippingAddress,
} from "@/lib/xpayments";
import { getBrlShippingCents } from "@/lib/checkout-config";
import { variants, type VariantId } from "@/lib/products";
import { onlyDigits } from "@/lib/validators";

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
  try {
    const body = await request.json().catch(() => ({}));
    const variant = String(body?.variant || "") as VariantId;
    const reference = String(body?.reference || "").trim();
    const name = String(body?.customer?.name || "").trim();
    const email = String(body?.customer?.email || "").trim();
    const document = onlyDigits(body?.customer?.document);
    const phone = onlyDigits(body?.customer?.phone);
    const shipping = readShipping(body?.shipping);
    const shippingCents = getBrlShippingCents();

    if (
      !variants[variant] ||
      !reference ||
      !name ||
      !email ||
      !document ||
      !phone ||
      shippingCents === null
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS_REQUEST",
            message: "Pedido inválido.",
          },
        },
        { status: 400 },
      );
    }

    try {
      const payload = await createPixCharge({
        variant,
        reference,
        customer: { name, email, document, phone },
        shipping,
        shippingCents,
      });

      const pix = normalizePixAction(payload);

      return NextResponse.json({
        success: true,
        data: {
          status: pix.status === "succeeded" ? "paid" : "pending",
          reference,
          transactionId: pix.transactionId,
          expiresAt: pix.expiresAt,
        },
      });
    } catch (error) {
      if (
        error instanceof XPaymentsError &&
        error.status === 409 &&
        error.code === "TRANSACTION_ALREADY_PAID"
      ) {
        return NextResponse.json({
          success: true,
          data: { status: "paid", reference },
        });
      }

      throw error;
    }
  } catch (error) {
    if (error instanceof XPaymentsError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status: error.status },
      );
    }

    console.error("[SIGNUM_PIX_STATUS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PIX_STATUS_FAILED",
          message: "Não foi possível consultar o pagamento.",
        },
      },
      { status: 500 },
    );
  }
}
