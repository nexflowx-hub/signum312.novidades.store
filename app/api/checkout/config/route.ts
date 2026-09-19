import { NextResponse } from "next/server";
import { getBrlShippingCents, XPAYMENTS_STORES } from "@/lib/checkout-config";
import {
  getPaymentOrchestrator,
  getPixBrasilStore,
} from "@/lib/pixbrasil";

export async function GET() {
  const shippingCents = getBrlShippingCents();
  const orchestrator = getPaymentOrchestrator();
  const store =
    orchestrator === "PIXBRASIL"
      ? getPixBrasilStore()
      : XPAYMENTS_STORES.BRL;

  return NextResponse.json({
    success: true,
    data: {
      currency: "BRL",
      orchestrator,
      store,
      shippingConfigured: shippingCents !== null,
      shippingCents,
      freeShipping: shippingCents === 0,
    },
  });
}
