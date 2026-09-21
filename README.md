# SIGNUM 312 — Novidades.store

Funil de venda single-product em produção para `signum312.novidades.store`.

## Oferta atual

- Edição Pátina: **R$ 49,90** (preço anterior R$ 99,90)
- Edição Dourada: **R$ 49,90** (preço anterior R$ 89,90)
- SIGNUM Duo: **R$ 69,90** (preço anterior R$ 169,90)
- **Frete grátis para todo o Brasil**
- Pagamento por PIX com QR Code e Copia e Cola

Os preços também são validados no servidor pelo Commerce Core; o navegador nunca define o valor da cobrança.

## Experiência

- Next.js App Router + TypeScript
- Funil mobile-first e editorial premium
- Fotografias reais das duas edições
- Hero adaptado ao criativo/campanha
- Sticky CTA em mobile
- Checkout BRL próprio
- CEP e endereço de entrega
- PIX com QR Code + Copia e Cola
- Confirmação de pagamento por polling
- Meta Pixel / GTM
- Atribuição por UTMs
- Pedidos persistidos no Commerce Core

## Produção

Variáveis essenciais:

```text
NEXT_PUBLIC_SITE_URL=https://signum312.novidades.store
NEXT_PUBLIC_SUPABASE_URL=https://eivqvrfsreaopzlvhadu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only>
COMMERCE_STOREFRONT_CODE=SIGNUM312-BR

PAYMENT_ORCHESTRATOR=PIXBRASIL
PIXBRASIL_API_URL=https://api.pixbrasil.org/api/v1
PIXBRASIL_API_KEY=<server-only>
PIXBRASIL_STORE=SIGNUM

NEXT_PUBLIC_META_PIXEL_ID=<optional>
NEXT_PUBLIC_GTM_ID=<optional>
```

O comprador não recebe nomes de providers, Stores, rotas, chaves ou detalhes da infraestrutura.

## Fluxo da compra

```text
Anúncio / conteúdo
  -> landing SIGNUM 312
  -> escolha Pátina / Dourada / Duo
  -> checkout
  -> dados + endereço
  -> preço validado no servidor
  -> pedido criado
  -> PIX gerado
  -> QR Code / Copia e Cola
  -> confirmação
  -> pedido pago
```

## Tracking

Eventos principais:

- PageView
- ViewContent
- SelectVariant
- AddToCart
- InitiateCheckout
- checkout_view
- pix_generated
- pix_copy
- Purchase

## Design

A direção visual é `luxury editorial × artefato × história × e-commerce`, com preto profundo, marfim, ouro envelhecido e verde-pátina. O funil evita linguagem técnica, estados de teste e referências internas na superfície do comprador.
