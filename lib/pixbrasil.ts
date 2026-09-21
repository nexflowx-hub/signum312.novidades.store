import "server-only";

import type { VariantId } from "./products";
import type { PixCustomer, ShippingAddress } from "./xpayments";

const API_URL =
  process.env.PIXBRASIL_API_URL ||
  "https://api.pixbrasil.org/api/v1";

const API_KEY = process.env.PIXBRASIL_API_KEY || "";
const STORE = process.env.PIXBRASIL_STORE || "SIGNUM";

export type PaymentOrchestrator = "XPAYMENTS" | "PIXBRASIL";

export function getPaymentOrchestrator(): PaymentOrchestrator {
  return process.env.PAYMENT_ORCHESTRATOR?.trim().toUpperCase() === "PIXBRASIL"
    ? "PIXBRASIL"
    : "XPAYMENTS";
}

export function getPixBrasilStore() {
  return STORE;
}

export class PixBrasilError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public payload?: unknown,
  ) {
    super(message);
    this.name = "PixBrasilError";
  }
}

function assertConfigured() {
  if (!API_KEY) {
    throw new PixBrasilError(
      503,
      "PIXBRASIL_NOT_CONFIGURED",
      "A integração PiXBrasil ainda não está configurada neste ambiente.",
    );
  }
}

export type PixBrasilResult = {
  success: true;
  data: {
    paymentIntentId: string;
    idempotentReplay: boolean;
    status: string;
    amount: number;
    currency: "BRL";
    reference: string;
    store: { code: string; name: string };
    routing: {
      mode: string;
      policy: string | null;
      policyVersion?: number;
      providerCode: string | null;
      gatewayAlias: string | null;
      releaseClass?: string | null;
      crossReleaseClassFailover?: boolean;
    };
    economics?: {
      grossBrl: number;
      providerRouteCostBrl: number;
      platformFeeBrl: number;
      estimatedMerchantNetBrl: number;
      routeCostProfile: string;
      platformFeeProfile: string | null;
    } | null;
    release?: {
      profile: string;
      rules: unknown[];
    };
    action?: {
      copyPaste?: string;
      pixString?: string;
      qrCodeBase64?: string;
      qrCodeUrl?: string;
      qrCode?: string;
      qrCodeImage?: string;
      expiresAt?: string | null;
    };
    providerPaymentId?: string;
    transactionId?: string;
  };
};

function shippingLine(input: ShippingAddress) {
  return [
    input.street,
    input.number,
    input.complement,
    input.neighborhood,
    input.city,
    input.state,
    input.cep,
  ]
    .filter(Boolean)
    .join(", ")
    .slice(0, 500);
}

export async function createPixBrasilCharge(input: {
  variant: VariantId;
  reference: string;
  customer: PixCustomer;
  shipping: ShippingAddress;
  shippingCents: number;
  amountCents: number;
  sku: string;
  edition: string;
  attribution?: Record<string, string>;
}): Promise<PixBrasilResult> {
  assertConfigured();

  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new PixBrasilError(
      500,
      "INVALID_SERVER_AMOUNT",
      "O valor do pedido não é válido.",
    );
  }

  const idempotencyKey = `signum312:${input.reference}:pix:1`;

  const response = await fetch(API_URL + "/payments/charge", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    cache: "no-store",
    body: JSON.stringify({
      store: STORE,
      amount: input.amountCents / 100,
      currency: "BRL",
      reference: input.reference,
      description: `SIGNUM 312 — ${input.edition}`,
      payer: {
        name: input.customer.name,
        email: input.customer.email,
        taxId: input.customer.document,
        phone: input.customer.phone,
      },
      metadata: {
        order_id: input.reference,
        storefront: "signum312.novidades.store",
        ecosystem: "Arte&Vida",
        product: "SIGNUM 312",
        sku: input.sku,
        variant: input.variant,
        shipping_cents: String(input.shippingCents),
        shipping_address: shippingLine(input.shipping),
        shipping_cep: input.shipping.cep,
        shipping_state: input.shipping.state,
        customer_phone: input.customer.phone,
        ...input.attribution,
      },
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as
    | PixBrasilResult
    | Record<string, unknown>;

  if (!response.ok) {
    const root = payload as Record<string, any>;
    const error = root?.error ?? root;

    throw new PixBrasilError(
      response.status,
      String(error?.code || "PIXBRASIL_ERROR"),
      String(
        error?.message ||
          root?.message ||
          "Não foi possível iniciar o pagamento PIX.",
      ),
      payload,
    );
  }

  return payload as PixBrasilResult;
}

export function normalizePixBrasilAction(payload: PixBrasilResult) {
  const data = payload.data;
  const action = data?.action || {};
  const copyPaste = String(
    action.copyPaste || action.pixString || "",
  ).trim();

  let qrCode = String(
    action.qrCodeBase64 ||
      action.qrCodeUrl ||
      action.qrCode ||
      action.qrCodeImage ||
      "",
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
    mode:
      data.status === "SHADOW_ONLY" || data.routing?.mode === "SHADOW"
        ? ("shadow" as const)
        : ("live" as const),
    paymentIntentId: String(data.paymentIntentId || ""),
    transactionId: String(
      data.transactionId || data.providerPaymentId || data.paymentIntentId || "",
    ),
    reference: String(data.reference || ""),
    status: String(data.status || "pending"),
    copyPaste,
    qrCode,
    expiresAt: action.expiresAt ? String(action.expiresAt) : null,
    routing: data.routing,
    economics: data.economics ?? null,
    release: data.release ?? null,
  };
}


export async function getPixBrasilPayment(paymentIntentId: string) {
  assertConfigured();

  const id = String(paymentIntentId || "").trim();
  if (!id) {
    throw new PixBrasilError(
      400,
      "PIX_PAYMENT_ID_REQUIRED",
      "Identificador do pagamento ausente.",
    );
  }

  const response = await fetch(
    API_URL + "/payments/" + encodeURIComponent(id),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const root = payload as Record<string, any>;
    const error = root?.error ?? root;

    throw new PixBrasilError(
      response.status,
      String(error?.code || "PIX_STATUS_ERROR"),
      String(
        error?.message ||
          root?.message ||
          "Não foi possível consultar o pagamento.",
      ),
      payload,
    );
  }

  return payload as {
    success: true;
    data: {
      paymentIntentId: string;
      reference?: string | null;
      status: string;
      completedAt?: string | null;
    };
  };
}

export function isPixBrasilPaidStatus(status: string) {
  return ["SUCCEEDED", "PAID", "COMPLETED"].includes(
    String(status || "").trim().toUpperCase(),
  );
}
