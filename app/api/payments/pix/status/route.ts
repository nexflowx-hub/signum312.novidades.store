import { NextResponse } from "next/server";
import { createPixCharge, normalizePixAction, XPaymentsError } from "@/lib/xpayments";
import { variants, type VariantId } from "@/lib/products";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const variant = String(body?.variant || "") as VariantId;
    const reference = String(body?.reference || "").trim();
    const name = String(body?.customer?.name || "").trim();
    const email = String(body?.customer?.email || "").trim();
    const document = String(body?.customer?.document || "").replace(/\D/g, "");

    if (!variants[variant] || !reference || !name || !email || !document) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_STATUS_REQUEST", message: "Pedido inválido." },
        },
        { status: 400 },
      );
    }

    try {
      const payload = await createPixCharge({
        variant,
        reference,
        customer: { name, email, document },
      });

      const pix = normalizePixAction(payload);

      return NextResponse.json({
        success: true,
        data: {
          status: pix.status === "succeeded" ? "paid" : "pending",
          reference,
          transactionId: pix.transactionId,
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
