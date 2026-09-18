import { NextResponse } from "next/server";
import { variants, type VariantId } from "@/lib/products";

const checkoutByVariant: Record<VariantId, string | undefined> = {
  patina: process.env.CHECKOUT_PATINA_URL,
  gold: process.env.CHECKOUT_GOLD_URL,
  duo: process.env.CHECKOUT_DUO_URL,
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const variant = body.variant as VariantId;

  if (!variant || !variants[variant]) {
    return NextResponse.json({ message: "Variante inválida." }, { status: 400 });
  }

  let url = checkoutByVariant[variant];

  if (!url && process.env.CHECKOUT_BASE_URL) {
    const target = new URL(process.env.CHECKOUT_BASE_URL);
    target.searchParams.set("product", "signum312");
    target.searchParams.set("variant", variant);

    const attribution = body.attribution || {};
    Object.entries(attribution).forEach(([key, value]) => {
      if (typeof value === "string") target.searchParams.set(key, value);
    });

    url = target.toString();
  }

  if (!url) {
    return NextResponse.json(
      {
        message:
          "Configure CHECKOUT_PATINA_URL, CHECKOUT_GOLD_URL, CHECKOUT_DUO_URL ou CHECKOUT_BASE_URL no ambiente de produção.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ url });
}
