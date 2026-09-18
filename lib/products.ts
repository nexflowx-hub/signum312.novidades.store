export type VariantId = "patina" | "gold" | "duo";

export type ProductVariant = {
  id: VariantId;
  name: string;
  edition: string;
  price: number;
  eyebrow: string;
  description: string;
  accent: string;
};

export const variants: Record<VariantId, ProductVariant> = {
  patina: {
    id: "patina",
    name: "SIGNUM 312",
    edition: "Pátina",
    price: 99.9,
    eyebrow: "A aparência do tempo",
    description:
      "Acabamento escuro com nuances verde-pátina, textura irregular e presença visual marcante.",
    accent: "patina",
  },
  gold: {
    id: "gold",
    name: "SIGNUM 312",
    edition: "Dourada",
    price: 89.9,
    eyebrow: "O clássico",
    description:
      "Dourado envelhecido, contraste profundo e uma leitura mais tradicional do símbolo.",
    accent: "gold",
  },
  duo: {
    id: "duo",
    name: "SIGNUM 312",
    edition: "Duo",
    price: 169.9,
    eyebrow: "Duas versões. Um significado.",
    description:
      "Receba a Edição Pátina e a Edição Dourada no mesmo pedido.",
    accent: "duo",
  },
};

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
