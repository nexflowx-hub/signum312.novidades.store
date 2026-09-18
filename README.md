# SIGNUM 312 — Novidades.store

Single-product conversion funnel para `signum312.novidades.store`.

## Stack

- Next.js App Router
- TypeScript
- CSS sem runtime UI dependencies
- Meta Pixel / GTM
- Checkout adapter por variáveis de ambiente

## Local

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Checkout

Configure URLs dedicadas:

- `CHECKOUT_PATINA_URL`
- `CHECKOUT_GOLD_URL`
- `CHECKOUT_DUO_URL`

ou `CHECKOUT_BASE_URL`.

O handoff genérico acrescenta `product=signum312`, `variant` e UTMs persistidas.

## Tracking

Opcional:

- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_GTM_ID`

## Princípios de conversão

- Produto imediatamente visível
- Message match anúncio → landing
- Pátina, Dourada e Duo como ofertas claras
- Sticky CTA mobile
- Sem falsa escassez, reviews fictícias ou countdown enganoso
- Narrativa histórica enquadrada como tradição, sem falsa proveniência
- Mobile-first e dependências mínimas

## Media

A V1 usa uma representação visual própria do medalhão para permitir deploy imediato.
Substituir pelo packshot e vídeos finais do produto antes de tráfego pago em escala.
