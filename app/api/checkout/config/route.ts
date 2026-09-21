import { NextResponse } from "next/server";
import { getBrlShippingCents } from "@/lib/checkout-config";

export async function GET() {
  const shippingCents = getBrlShippingCents();

  return NextResponse.json({
    success: true,
    data: {
      currency: "BRL",
      shippingConfigured: true,
      shippingCents,
      freeShipping: true,
    },
  });
}
