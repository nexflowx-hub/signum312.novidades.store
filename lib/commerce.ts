import "server-only";

import type { VariantId } from "./products";
import type { PixCustomer, ShippingAddress } from "./xpayments";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://eivqvrfsreaopzlvhadu.supabase.co";

const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const STOREFRONT_CODE =
  process.env.COMMERCE_STOREFRONT_CODE || "SIGNUM312-BR";

const DEFAULT_PAYMENT_STORE =
  process.env.XPAYMENTS_BRL_STORE || "NOVIDADES-BRL";

export class CommerceError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "CommerceError";
  }
}

type StorefrontRow = {
  id: string;
  legal_entity_id: string;
  code: string;
};

type VariantRow = {
  id: string;
  product_id: string;
  sku: string;
  title: string;
  price_cents: number;
};

type ListingRow = {
  id: string;
  product_id: string;
};

type ListingPriceRow = {
  amount_cents: number;
  currency: "BRL";
};

type OrderRow = {
  id: string;
  number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_document: string;
  shipping_address: ShippingAddress & { country?: string };
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: "BRL";
  storefront_id: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  listing_id: string | null;
  title: string;
  sku: string;
  unit_price_cents: number;
  quantity: number;
};

export type PendingOrder = {
  orderId: string;
  reference: string;
  storefrontId: string;
  sellerEntityId: string;
  productId: string;
  variantId: string;
  listingId: string;
  sku: string;
  edition: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: "BRL";
};

function assertConfigured() {
  if (!SERVICE_ROLE) {
    throw new CommerceError(
      503,
      "COMMERCE_DB_NOT_CONFIGURED",
      "O Commerce Core ainda não está configurado neste ambiente.",
    );
  }
}

function headers(prefer?: string) {
  return {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function rest<T>(
  path: string,
  init: RequestInit = {},
  expected: number[] = [200],
): Promise<T> {
  assertConfigured();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...headers(),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : null;

  if (!expected.includes(response.status)) {
    throw new CommerceError(
      502,
      "COMMERCE_DB_ERROR",
      "Não foi possível registrar o pedido no Commerce Core.",
      { status: response.status, payload },
    );
  }

  return payload as T;
}

function skuForVariant(variant: VariantId) {
  if (variant === "patina") return "SIGNUM312-PATINA";
  if (variant === "gold") return "SIGNUM312-GOLD";
  return "SIGNUM312-DUO";
}

export function createOrderReference(variant: VariantId) {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  return (
    "NOV-BR-S312-" +
    variant.toUpperCase() +
    "-" +
    stamp +
    "-" +
    random
  ).slice(0, 96);
}

async function getStorefront(): Promise<StorefrontRow> {
  const rows = await rest<StorefrontRow[]>(
    "storefronts?select=id,legal_entity_id,code&code=eq." +
      encodeURIComponent(STOREFRONT_CODE) +
      "&status=in.(live,preview)&limit=1",
  );

  if (!rows[0]) {
    throw new CommerceError(
      503,
      "STOREFRONT_NOT_FOUND",
      "O storefront SIGNUM 312 não está ativo no Commerce Core.",
    );
  }

  return rows[0];
}

async function getVariant(variant: VariantId): Promise<VariantRow> {
  const sku = skuForVariant(variant);

  const rows = await rest<VariantRow[]>(
    "product_variants?select=id,product_id,sku,title,price_cents&sku=eq." +
      encodeURIComponent(sku) +
      "&limit=1",
  );

  if (!rows[0]) {
    throw new CommerceError(
      503,
      "VARIANT_NOT_FOUND",
      "A variante selecionada não está publicada no Commerce Core.",
    );
  }

  return rows[0];
}

async function getListing(
  storefrontId: string,
  productId: string,
): Promise<ListingRow> {
  const rows = await rest<ListingRow[]>(
    "product_listings?select=id,product_id&storefront_id=eq." +
      encodeURIComponent(storefrontId) +
      "&product_id=eq." +
      encodeURIComponent(productId) +
      "&status=eq.published&limit=1",
  );

  if (!rows[0]) {
    throw new CommerceError(
      503,
      "LISTING_NOT_FOUND",
      "A oferta SIGNUM 312 não está publicada no Commerce Core.",
    );
  }

  return rows[0];
}

async function getListingPrice(
  listingId: string,
  variantId: string,
): Promise<ListingPriceRow> {
  const rows = await rest<ListingPriceRow[]>(
    "listing_prices?select=amount_cents,currency&listing_id=eq." +
      encodeURIComponent(listingId) +
      "&variant_id=eq." +
      encodeURIComponent(variantId) +
      "&currency=eq.BRL&active=eq.true&limit=1",
  );

  if (!rows[0]) {
    throw new CommerceError(
      503,
      "PRICE_NOT_FOUND",
      "O preço desta variante não está ativo no Commerce Core.",
    );
  }

  return rows[0];
}

export async function createPendingOrder(input: {
  variant: VariantId;
  reference: string;
  customer: PixCustomer;
  shipping: ShippingAddress;
  shippingCents: number;
  paymentStore?: string;
  paymentOrchestrator?: "XPAYMENTS" | "PIXBRASIL";
  attribution?: Record<string, string>;
}): Promise<PendingOrder> {
  const [storefront, variant] = await Promise.all([
    getStorefront(),
    getVariant(input.variant),
  ]);

  const listing = await getListing(storefront.id, variant.product_id);
  const price = await getListingPrice(listing.id, variant.id);

  const subtotalCents = price.amount_cents;
  const totalCents = subtotalCents + input.shippingCents;

  const orders = await rest<OrderRow[]>(
    "orders?select=id,number,status,customer_name,customer_email,customer_phone,customer_document,shipping_address,subtotal_cents,shipping_cents,total_cents,currency,storefront_id",
    {
      method: "POST",
      headers: headers("return=representation"),
      body: JSON.stringify({
        number: input.reference,
        profile_id: null,
        market: "BR",
        status: "pending_payment",
        customer_name: input.customer.name,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone,
        customer_document: input.customer.document,
        delivery_method: "shipping",
        shipping_address: {
          cep: input.shipping.cep,
          street: input.shipping.street,
          number: input.shipping.number,
          complement: input.shipping.complement || "",
          neighborhood: input.shipping.neighborhood,
          city: input.shipping.city,
          state: input.shipping.state,
          country: "BR",
        },
        shipping_option: input.shippingCents === 0 ? "free" : "flat_rate",
        shipping_cents: input.shippingCents,
        installation_cents: 0,
        subtotal_cents: subtotalCents,
        discount_cents: 0,
        total_cents: totalCents,
        currency: "BRL",
        idempotency_key: input.reference,
        demo: false,
        storefront_id: storefront.id,
        seller_entity_id: storefront.legal_entity_id,
        payment_store: input.paymentStore || DEFAULT_PAYMENT_STORE,
        locale: "pt-BR",
        metadata: {
          storefront: "signum312.novidades.store",
          ecosystem: "Arte&Vida",
          variant: input.variant,
          payment_orchestrator: input.paymentOrchestrator || "XPAYMENTS",
          ...input.attribution,
        },
      }),
    },
    [201],
  );

  const order = orders[0];

  if (!order) {
    throw new CommerceError(
      502,
      "ORDER_CREATE_FAILED",
      "O pedido não pôde ser registrado.",
    );
  }

  await rest<unknown>(
    "order_items",
    {
      method: "POST",
      headers: headers("return=minimal"),
      body: JSON.stringify({
        order_id: order.id,
        product_id: variant.product_id,
        variant_id: variant.id,
        listing_id: listing.id,
        title: "SIGNUM 312 — " + variant.title,
        sku: variant.sku,
        unit_price_cents: subtotalCents,
        quantity: 1,
        installation: false,
        metadata: {
          variant: input.variant,
        },
      }),
    },
    [201],
  );

  return {
    orderId: order.id,
    reference: order.number,
    storefrontId: storefront.id,
    sellerEntityId: storefront.legal_entity_id,
    productId: variant.product_id,
    variantId: variant.id,
    listingId: listing.id,
    sku: variant.sku,
    edition: variant.title,
    subtotalCents,
    shippingCents: input.shippingCents,
    totalCents,
    currency: "BRL",
  };
}

export async function recordPendingPayment(input: {
  order: PendingOrder;
  transactionId: string;
  provider?: "xpayments" | "pixbrasil";
  paymentStore?: string;
  idempotencySuffix?: string;
  metadata?: Record<string, unknown>;
  providerPayload?: unknown;
}) {
  await rest<unknown>(
    "payments",
    {
      method: "POST",
      headers: headers("return=minimal"),
      body: JSON.stringify({
        order_id: input.order.orderId,
        provider: input.provider || "xpayments",
        provider_ref: input.transactionId || null,
        method: "pix",
        status: "pending",
        amount_cents: input.order.totalCents,
        currency: "BRL",
        storefront_id: input.order.storefrontId,
        payment_store: input.paymentStore || DEFAULT_PAYMENT_STORE,
        idempotency_key:
          input.order.reference + (input.idempotencySuffix || ":pix:1"),
        metadata: {
          reference: input.order.reference,
          source: "signum312.novidades.store",
          ...input.metadata,
        },
        raw_payload: input.providerPayload ?? null,
      }),
    },
    [201],
  );
}

export async function markOrderPaymentFailed(reference: string) {
  try {
    await rest<unknown>(
      "orders?number=eq." + encodeURIComponent(reference),
      {
        method: "PATCH",
        headers: headers("return=minimal"),
        body: JSON.stringify({ status: "payment_failed" }),
      },
      [204],
    );
  } catch (error) {
    console.error("[COMMERCE_MARK_FAILED_ERROR]", error);
  }
}

export async function loadPendingOrderContext(reference: string) {
  const orders = await rest<OrderRow[]>(
    "orders?select=id,number,status,subtotal_cents,shipping_cents,total_cents,currency,storefront_id&number=eq." +
      encodeURIComponent(reference) +
      "&limit=1",
  );

  const order = orders[0];

  if (!order) {
    throw new CommerceError(404, "ORDER_NOT_FOUND", "Pedido não encontrado.");
  }

  const items = await rest<OrderItemRow[]>(
    "order_items?select=id,order_id,product_id,variant_id,listing_id,title,sku,unit_price_cents,quantity&order_id=eq." +
      encodeURIComponent(order.id) +
      "&limit=1",
  );

  const item = items[0];

  if (!item) {
    throw new CommerceError(
      404,
      "ORDER_ITEM_NOT_FOUND",
      "Item do pedido não encontrado.",
    );
  }

  return { order, item };
}

export async function markOrderPaid(
  reference: string,
  transactionId?: string,
) {
  const { order } = await loadPendingOrderContext(reference);

  await rest<unknown>(
    "orders?id=eq." + encodeURIComponent(order.id),
    {
      method: "PATCH",
      headers: headers("return=minimal"),
      body: JSON.stringify({ status: "paid" }),
    },
    [204],
  );

  const filter = transactionId
    ? "provider_ref=eq." + encodeURIComponent(transactionId)
    : "order_id=eq." + encodeURIComponent(order.id);

  await rest<unknown>(
    "payments?" + filter,
    {
      method: "PATCH",
      headers: headers("return=minimal"),
      body: JSON.stringify({ status: "paid" }),
    },
    [204],
  );
}
