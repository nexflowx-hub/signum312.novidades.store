# SIGNUM 312 — Novidades.store

Conversion-first single-product funnel for `signum312.novidades.store`.

## Current architecture

- Next.js App Router + TypeScript
- Mobile-first funnel
- Native BRL checkout
- XPAYMENTS S2S PIX
- Store: **NOVIDADES-BRL**
- Reserved international Store: **NOVIDADES-EURO**
- Real product proof images
- Campaign-aware hero copy
- Meta Pixel / GTM hooks
- CEP lookup + fulfillment fields
- Server-side price and shipping validation

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Required production variables

```text
NEXT_PUBLIC_SITE_URL=https://signum312.novidades.store

XPAYMENTS_API_URL=https://api.xpayments.digital/api/v1
XPAYMENTS_BRL_API_KEY=<LIVE API KEY bound to NOVIDADES-BRL>

BRL_SHIPPING_CENTS=<integer cents; use 0 for free shipping>

NEXT_PUBLIC_META_PIXEL_ID=<optional>
NEXT_PUBLIC_GTM_ID=<optional>
```

The BRL API key must belong to the **NOVIDADES-BRL** Store and must have:
- Store ACTIVE
- currency BRL
- `payments_write`
- active PIX routing/provider connection

## BRL checkout flow

```text
Ad
  -> signum312.novidades.store
  -> select Pátina / Dourada / Duo
  -> /checkout?variant=...
  -> contact + CPF/CNPJ + delivery address
  -> server validates product price + shipping
  -> POST /api/payments/pix
  -> server POSTs to XPAYMENTS /api/v1/payments/charge
  -> Store NOVIDADES-BRL
  -> PIX S2S
  -> QR Code / Copia e Cola
  -> status polling
  -> paid confirmation
```

The XPAYMENTS API key never reaches the browser.

## Fulfillment metadata

The storefront sends a whitelisted fulfillment set with the payment:
- product / SKU / variant
- storefront
- Arte&Vida ecosystem
- shipping CEP, street, number, complement, neighborhood, city, state
- customer phone
- UTMs
- shipping amount

XPAYMENTS should persist this metadata on the Transaction so paid orders can be fulfilled without reconstructing information from the browser.

## Server-side price protection

The browser never chooses an amount.

Server price catalog:
- Pátina: R$ 99,90
- Dourada: R$ 89,90
- Duo: R$ 169,90

Shipping is also loaded from server environment. If `BRL_SHIPPING_CENTS` is not configured, checkout blocks payment creation.

## Campaign message match

The landing changes its hero message based on campaign identifiers such as `utm_content`:

- A1 -> 1.700 anos
- A2 -> Não é apenas um colar
- A3 -> Roma 312 / Constantino
- A4 -> Dourada
- A5 -> Duo
- A6 -> In Hoc Signo Vinces

Explicit `?variant=patina|gold|duo` overrides the initial selected offer.

## Tracking

Client-side events:
- PageView
- ViewContent
- SelectVariant
- AddToCart
- InitiateCheckout
- checkout_view
- pix_generated
- pix_copy
- Purchase

For production attribution, the next evolution should be server-side webhook/CAPI so purchase measurement does not depend on the buyer keeping the confirmation page open.

## Responsive conversion design

The current funnel is optimized for:
- mobile phones
- tablets
- desktop

Key rules:
- offer appears immediately after hero
- sticky mobile buy CTA
- touch targets >= 44px
- safe-area support
- reduced-motion support
- compact checkout summary on mobile
- CEP autofill with manual fallback
- price and shipping shown before PIX generation

## International / EUR

The architecture reserves **NOVIDADES-EURO**, but EUR is intentionally not available to buyers until:
1. EUR retail prices are defined
2. payment methods are selected
3. the Store routing is confirmed
4. end-to-end payment is tested

Recommended first EUR mix: card + MB WAY, processed through XPAYMENTS.

## Go-live gates

1. Connect deployment and domain.
2. Configure NOVIDADES-BRL API key.
3. Configure BRL shipping policy.
4. Persist transaction fulfillment metadata in XPAYMENTS.
5. Confirm seller identity and contact details in legal pages.
6. Run low-value controlled PIX test.
7. Verify provider webhook -> XPAYMENTS succeeded -> checkout paid state.
8. Verify fulfillment data for the paid transaction.
9. Verify Pixel/GTM and ideally CAPI.
10. Replace/augment current source photos with final professional packshots.
