import { NextResponse } from "next/server";
import { createPixCharge, normalizePixAction, XPaymentsError } from "@/lib/xpayments";
import { variants, type VariantId } from "@/lib/products";

function cleanDocument(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function referenceFor(variant: VariantId) {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return ("SIGNUM312-" + variant.toUpperCase() + "-" + stamp + "-" + random).slice(0, 96);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const variant = String(body?.variant || "") as VariantId;

    if (!variants[variant]) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_VARIANT", message: "Produto inválido." } },
        { status: 400 },
      );
    }

    const name = String(body?.customer?.name || "").trim().replace(/\s+/g, " ");
    const email = String(body?.customer?.email || "").trim().toLowerCase();
    const document = cleanDocument(body?.customer?.document);

    if (name.length < 3) {
      return NextResponse.json(
        { success: false, error: { code: "NAME_REQUIRED", message: "Informe o nome completo." } },
        { status: 400 },
      );
    }

    if (!validEmail(email)) {
      return NextResponse.json(
        { success: false, error: { code: "EMAIL_INVALID", message: "Informe um e-mail válido." } },
        { status: 400 },
      );
    }

    if (document.length !== 11 && document.length !== 14) {
      return NextResponse.json(
        { success: false, error: { code: "DOCUMENT_INVALID", message: "Informe um CPF ou CNPJ válido." } },
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

    const reference = referenceFor(variant);
    const payload = await createPixCharge({
      variant,
      reference,
      customer: { name, email, document },
      attribution,
    });

    const pix = normalizePixAction(payload);

    if (!pix.copyPaste) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PIX_QR_MISSING",
            message: "O PIX foi criado, mas o código de pagamento não foi recebido.",
          },
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...pix,
        variant,
        amount: variants[variant].price,
        currency: "BRL",
      },
    });
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

    console.error("[SIGNUM_PIX_CREATE_ERROR]", error);

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
