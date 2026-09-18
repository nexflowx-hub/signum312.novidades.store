import { NextResponse } from "next/server";
import { getBrlShippingCents, XPAYMENTS_STORES } from "@/lib/checkout-config";

export async function GET() {
  const shippingCents = getBrlShippingCents();

  return NextResponse.json({
    success: true,
    data: {
      currency: "BRL",
      store: XPAYMENTS_STORES.BRL,
      shippingConfigured: shippingCents !== null,
      shippingCents,
      freeShipping: shippingCents === 0,
    },
  });
}
