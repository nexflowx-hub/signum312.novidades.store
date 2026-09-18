import type { VariantId } from "./products";
import { variants } from "./products";

const API_URL =
  process.env.XPAYMENTS_API_URL ||
  "https://api.xpayments.digital/api/v1";

const API_KEY = process.env.XPAYMENTS_API_KEY || "";

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

export type PixCustomer = {
  name: string;
  email: string;
  document: string;
};

function assertConfigured() {
  if (!API_KEY) {
    throw new XPaymentsError(
      503,
      "XPAYMENTS_NOT_CONFIGURED",
      "A integração de pagamento ainda não foi configurada.",
    );
  }
}

export function amountForVariant(variant: VariantId) {
  const item = variants[variant];
  if (!item) {
    throw new XPaymentsError(400, "INVALID_VARIANT", "Produto inválido.");
  }

  return Math.round(item.price * 100);
}

export async function createPixCharge(input: {
  variant: VariantId;
  reference: string;
  customer: PixCustomer;
  attribution?: Record<string, string>;
}) {
  assertConfigured();

  const amount = amountForVariant(input.variant);
  const item = variants[input.variant];

  const response = await fetch(API_URL + "/payments/charge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    cache: "no-store",
    body: JSON.stringify({
      amount,
      currency: "BRL",
      payment_method_types: ["pix"],
      reference: input.reference,
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        document: input.customer.document,
      },
      metadata: {
        order_id: input.reference,
        reference: input.reference,
        product: "SIGNUM 312",
        variant: input.variant,
        description: "SIGNUM 312 — " + item.edition,
        channel: "signum312.novidades.store",
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
  };
}
