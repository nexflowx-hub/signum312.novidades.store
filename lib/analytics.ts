import type { VariantId } from "./products";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });

  if (window.fbq) {
    const metaEventMap: Record<string, string> = {
      page_view: "PageView",
      view_content: "ViewContent",
      add_to_cart: "AddToCart",
      initiate_checkout: "InitiateCheckout",
      purchase: "Purchase",
    };

    const metaEvent = metaEventMap[event];
    if (metaEvent) window.fbq("track", metaEvent, payload);
    else window.fbq("trackCustom", event, payload);
  }
}

export function getAttribution() {
  if (typeof window === "undefined") return {};

  const url = new URL(window.location.href);
  const keys = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"];
  const current: Record<string, string> = {};

  keys.forEach((key) => {
    const value = url.searchParams.get(key);
    if (value) {
      current[key] = value;
      localStorage.setItem("signum_" + key, value);
    }
  });

  keys.forEach((key) => {
    if (!current[key]) {
      const stored = localStorage.getItem("signum_" + key);
      if (stored) current[key] = stored;
    }
  });

  return current;
}

export function productPayload(
  variant: VariantId,
  value: number,
  extra: Record<string, unknown> = {},
) {
  return {
    content_ids: ["signum312_" + variant],
    content_name: "SIGNUM 312 " + variant,
    content_type: "product",
    currency: "BRL",
    value,
    variant,
    ...extra,
  };
}
