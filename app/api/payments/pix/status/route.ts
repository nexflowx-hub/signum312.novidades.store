import { NextResponse } from "next/server";
import {
  createPixCharge,
  normalizePixAction,
  XPaymentsError,
} from "@/lib/xpayments";
import {
  CommerceError,
  loadPendingOrderContext,
  markOrderPaid,
} from "@/lib/commerce";
import type { VariantId } from "@/lib/products";

function variantFromSku(sku: string): VariantId | null {
  if (sku === "SIGNUM312-PATINA") return "patina";
  if (sku === "SIGNUM312-GOLD") return "gold";
  if (sku === "SIGNUM312-DUO") return "duo";
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const reference = String(body?.reference || "").trim().slice(0, 96);

    if (!reference) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS_REQUEST",
            message: "Referência do pedido ausente.",
          },
        },
        { status: 400 },
      );
    }

    const { order, item } = await loadPendingOrderContext(reference);

    if (order.status === "paid") {
      return NextResponse.json({
        success: true,
        data: { status: "paid", reference },
      });
    }

    const variant = variantFromSku(item.sku);

    if (!variant) {
      throw new CommerceError(
        500,
        "UNKNOWN_ORDER_VARIANT",
        "A variante do pedido não pôde ser identificada.",
      );
    }

    const shipping = order.shipping_address;

    try {
      const payload = await createPixCharge({
        variant,
        reference: order.number,
        customer: {
          name: order.customer_name,
          email: order.customer_email,
          document: order.customer_document,
          phone: order.customer_phone,
        },
        shipping: {
          cep: String(shipping.cep || ""),
          street: String(shipping.street || ""),
          number: String(shipping.number || ""),
          complement: String(shipping.complement || ""),
          neighborhood: String(shipping.neighborhood || ""),
          city: String(shipping.city || ""),
          state: String(shipping.state || ""),
        },
        shippingCents: order.shipping_cents,
        amountCents: order.total_cents,
        sku: item.sku,
        edition: item.title.replace(/^SIGNUM 312\s*[—-]\s*/i, ""),
      });

      const pix = normalizePixAction(payload);
      const paid = pix.status === "succeeded";

      if (paid) {
        await markOrderPaid(reference, pix.transactionId || undefined);
      }

      return NextResponse.json({
        success: true,
        data: {
          status: paid ? "paid" : "pending",
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
        await markOrderPaid(reference);

        return NextResponse.json({
          success: true,
          data: { status: "paid", reference },
        });
      }

      throw error;
    }
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
