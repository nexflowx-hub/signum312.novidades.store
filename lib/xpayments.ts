import type { VariantId } from "./products";
import { XPAYMENTS_STORES } from "./checkout-config";

const API_URL =
  process.env.XPAYMENTS_API_URL ||
  "https://api.xpayments.digital/api/v1";

const BRL_API_KEY =
  process.env.XPAYMENTS_BRL_API_KEY ||
  process.env.XPAYMENTS_API_KEY ||
  "";

export class XPaymentsError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public payload?: unknown,
  ) {
    super(message);
    this.name = "XPaymentsError";
  }
}

export type ShippingAddress = {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type PixCustomer = {
  name: string;
  email: string;
  document: string;
  phone: string;
};

function assertBrlConfigured() {
  if (!BRL_API_KEY) {
    throw new XPaymentsError(
      503,
      "XPAYMENTS_BRL_NOT_CONFIGURED",
      "A Store NOVIDADES-BRL ainda não está configurada neste ambiente.",
    );
  }
}

export async function createPixCharge(input: {
  variant: VariantId;
  reference: string;
  customer: PixCustomer;
  shipping: ShippingAddress;
  shippingCents: number;
  amountCents: number;
  sku: string;
  edition: string;
  attribution?: Record<string, string>;
}) {
  assertBrlConfigured();

  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new XPaymentsError(
      500,
      "INVALID_SERVER_AMOUNT",
      "O valor do pedido não é válido.",
    );
  }

  const shippingLine = [
    input.shipping.street,
    input.shipping.number,
    input.shipping.complement,
    input.shipping.neighborhood,
    input.shipping.city,
    input.shipping.state,
    input.shipping.cep,
  ]
    .filter(Boolean)
    .join(", ")
    .slice(0, 500);

  const response = await fetch(API_URL + "/payments/charge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": BRL_API_KEY,
    },
    cache: "no-store",
    body: JSON.stringify({
      amount: input.amountCents,
      currency: "BRL",
      payment_method_types: ["pix"],
      reference: input.reference,
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        document: input.customer.document,
        phone: input.customer.phone,
        address: shippingLine,
      },
      metadata: {
        order_id: input.reference,
        reference: input.reference,
        merchant_store: XPAYMENTS_STORES.BRL,
        storefront: "signum312.novidades.store",
        ecosystem: "Arte&Vida",
        product: "SIGNUM 312",
        sku: input.sku,
        variant: input.variant,
        description: "SIGNUM 312 — " + input.edition,
        shipping_cents: String(input.shippingCents),
        shipping_cep: input.shipping.cep,
        shipping_street: input.shipping.street.slice(0, 160),
        shipping_number: input.shipping.number.slice(0, 30),
        shipping_complement: String(input.shipping.complement || "").slice(0, 80),
        shipping_neighborhood: input.shipping.neighborhood.slice(0, 120),
        shipping_city: input.shipping.city.slice(0, 120),
        shipping_state: input.shipping.state.slice(0, 2),
        customer_phone: input.customer.phone,
        ...input.attribution,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = payload?.error || {};

    throw new XPaymentsError(
      response.status,
      String(error.code || "XPAYMENTS_ERROR"),
      String(error.message || "Não foi possível gerar o PIX."),
      payload,
    );
  }

  return payload;
}

export function normalizePixAction(payload: any) {
  const action = payload?.action || {};
  const copyPaste = String(action.copyPaste || action.pixString || "").trim();

  let qrCode = String(
    action.qrCodeBase64 || action.qrCodeUrl || action.qrCode || "",
  ).trim();

  if (
    qrCode &&
    !qrCode.startsWith("data:") &&
    !qrCode.startsWith("http://") &&
    !qrCode.startsWith("https://")
  ) {
    qrCode = "data:image/png;base64," + qrCode;
  }

  return {
    transactionId: String(payload?.transactionId || ""),
    reference: String(payload?.reference || ""),
    status: String(payload?.status || "pending"),
    copyPaste,
    qrCode,
    expiresAt: action.expiresAt ? String(action.expiresAt) : null,
  };
}
