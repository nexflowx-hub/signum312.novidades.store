export const XPAYMENTS_STORES = {
  BRL: "NOVIDADES-BRL",
  EUR: "NOVIDADES-EURO",
} as const;

export function getBrlShippingCents() {
  const value = process.env.BRL_SHIPPING_CENTS;
  if (value === undefined || value === "") return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;

  return parsed;
}

export function getBrlShippingLabel() {
  const cents = getBrlShippingCents();
  if (cents === null) return "Frete ainda não configurado";
  if (cents === 0) return "Frete grátis";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
