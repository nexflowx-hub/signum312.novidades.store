"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getAttribution, productPayload, track } from "@/lib/analytics";
import { formatBRL, variants, type VariantId } from "@/lib/products";
import { ProductVisual } from "./ProductVisual";

type CheckoutStep = "form" | "pix" | "paid";

type PixData = {
  transactionId: string;
  reference: string;
  status: string;
  copyPaste: string;
  qrCode: string;
  variant: VariantId;
  amount: number;
  currency: "BRL";
};

type Customer = {
  name: string;
  email: string;
  document: string;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatDocument(value: string) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export default function PixCheckout() {
  const search = useSearchParams();
  const rawVariant = search.get("variant");
  const variant: VariantId =
    rawVariant === "gold" || rawVariant === "duo" ? rawVariant : "patina";

  const product = variants[variant];
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    email: "",
    document: "",
  });
  const [step, setStep] = useState<CheckoutStep>("form");
  const [pix, setPix] = useState<PixData | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [attribution, setAttribution] = useState<Record<string, string>>({});
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    setAttribution(getAttribution());
  }, []);

  useEffect(() => {
    track(
      "checkout_view",
      productPayload(variant, product.price, {
        currency: "BRL",
        payment_method: "pix",
        ...attribution,
      }),
    );
  }, [variant, product.price, attribution]);

  useEffect(() => {
    if (step !== "pix" || !pix) return;

    const startedAt = Date.now();

    const poll = async () => {
      try {
        const response = await fetch("/api/payments/pix/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variant,
            reference: pix.reference,
            customer: {
              name: customer.name,
              email: customer.email,
              document: onlyDigits(customer.document),
            },
          }),
        });

        const body = await response.json();

        if (response.ok && body?.data?.status === "paid") {
          if (pollingRef.current) window.clearInterval(pollingRef.current);
          setStep("paid");
          track(
            "purchase",
            productPayload(variant, product.price, {
              currency: "BRL",
              payment_method: "pix",
              order_reference: pix.reference,
              transaction_id: pix.transactionId,
              ...attribution,
            }),
          );
        }
      } catch {
        // Mantemos o PIX visível; uma falha transitória de polling não invalida a cobrança.
      }

      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    };

    pollingRef.current = window.setInterval(poll, 4000);
    void poll();

    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, [step, pix, variant, product.price, customer, attribution]);

  async function createPix(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/payments/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant,
          customer: {
            name: customer.name,
            email: customer.email,
            document: onlyDigits(customer.document),
          },
          attribution,
        }),
      });

      const body = await response.json();

      if (!response.ok || !body?.data) {
        throw new Error(
          body?.error?.message || "Não foi possível gerar o PIX.",
        );
      }

      setPix(body.data);
      setStep("pix");

      track(
        "pix_generated",
        productPayload(variant, product.price, {
          currency: "BRL",
          payment_method: "pix",
          order_reference: body.data.reference,
          ...attribution,
        }),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o PIX agora.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyPix() {
    if (!pix?.copyPaste) return;

    try {
      await navigator.clipboard.writeText(pix.copyPaste);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
      track("pix_copy", {
        variant,
        reference: pix.reference,
        ...attribution,
      });
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o código abaixo.");
    }
  }

  return (
    <main className="checkout-shell">
      <header className="checkout-topbar">
        <Link href="/" className="checkout-brand">
          <span>✦</span> SIGNUM <strong>312</strong>
        </Link>
        <div className="secure-mark">
          <span>●</span> Checkout seguro
        </div>
      </header>

      <div className="checkout-grid">
        <section className="checkout-main">
          <div className="checkout-kicker">ARTE&VIDA · NOVIDADES.STORE</div>

          {step === "form" && (
            <>
              <div className="checkout-heading">
                <span className="step-number">01</span>
                <div>
                  <h1>Finalize com PIX</h1>
                  <p>Preencha os dados do pagador para gerar o QR Code.</p>
                </div>
              </div>

              <div className="currency-pill-row" aria-label="Moeda">
                <button className="currency-pill active" type="button">
                  <span>🇧🇷</span>
                  Brasil · BRL
                </button>
                <span className="currency-next">
                  Checkout internacional será ativado na segunda moeda.
                </span>
              </div>

              <form className="checkout-form" onSubmit={createPix}>
                <label>
                  <span>Nome completo</span>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Como consta no CPF"
                    value={customer.name}
                    onChange={(e) =>
                      setCustomer({ ...customer, name: e.target.value })
                    }
                    required
                    minLength={3}
                  />
                </label>

                <label>
                  <span>E-mail</span>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="voce@email.com"
                    value={customer.email}
                    onChange={(e) =>
                      setCustomer({ ...customer, email: e.target.value })
                    }
                    required
                  />
                  <small>Usaremos para identificação e comunicação do pedido.</small>
                </label>

                <label>
                  <span>CPF ou CNPJ</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    value={customer.document}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        document: formatDocument(e.target.value),
                      })
                    }
                    required
                  />
                  <small>Exigido pelo processamento PIX.</small>
                </label>

                {error && (
                  <div className="checkout-error" role="alert">
                    <strong>Não conseguimos gerar o PIX.</strong>
                    <span>{error}</span>
                  </div>
                )}

                <button className="pay-button" type="submit" disabled={busy}>
                  <span>
                    {busy ? "Gerando PIX..." : "Gerar PIX"}
                    <small>Pagamento instantâneo</small>
                  </span>
                  <strong>{formatBRL(product.price)}</strong>
                </button>

                <div className="checkout-security">
                  <span>◆</span>
                  <p>
                    Sua chave XPAYMENTS nunca é exposta no navegador. A cobrança
                    é criada diretamente entre o servidor da SIGNUM 312 e a API
                    de pagamentos.
                  </p>
                </div>
              </form>
            </>
          )}

          {step === "pix" && pix && (
            <div className="pix-stage">
              <div className="checkout-heading">
                <span className="step-number">02</span>
                <div>
                  <h1>PIX gerado</h1>
                  <p>Abra o app do seu banco e pague pelo QR Code ou Copia e Cola.</p>
                </div>
              </div>

              <div className="pix-card">
                <div className="pix-status">
                  <span className="pulse-dot" />
                  Aguardando pagamento
                </div>

                {pix.qrCode ? (
                  <div className="qr-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pix.qrCode} alt="QR Code PIX" />
                  </div>
                ) : (
                  <div className="qr-fallback">
                    <span>PIX</span>
                    <p>Use o código Copia e Cola abaixo.</p>
                  </div>
                )}

                <div className="pix-total">
                  <span>Total</span>
                  <strong>{formatBRL(product.price)}</strong>
                </div>

                <label className="pix-code">
                  <span>PIX Copia e Cola</span>
                  <textarea readOnly value={pix.copyPaste} rows={3} />
                </label>

                <button className="copy-button" type="button" onClick={copyPix}>
                  {copied ? "✓ Código copiado" : "Copiar código PIX"}
                </button>

                <div className="pix-help">
                  <strong>Como pagar</strong>
                  <ol>
                    <li>Abra o aplicativo do seu banco.</li>
                    <li>Escolha PIX e depois “Copia e Cola” ou leia o QR Code.</li>
                    <li>Confirme o valor e conclua o pagamento.</li>
                  </ol>
                </div>

                <div className="payment-watcher">
                  <span className="watcher-spinner" />
                  Estamos verificando o pagamento automaticamente.
                  {elapsed > 10 && <small> Pode manter esta página aberta.</small>}
                </div>
              </div>

              <p className="reference-line">
                Pedido <strong>{pix.reference}</strong>
              </p>
            </div>
          )}

          {step === "paid" && pix && (
            <div className="success-stage">
              <div className="success-icon">✓</div>
              <p className="eyebrow">PAGAMENTO CONFIRMADO</p>
              <h1>Seu SIGNUM 312 está confirmado.</h1>
              <p>
                Recebemos a confirmação do PIX. Guarde a referência abaixo para
                qualquer contato sobre o pedido.
              </p>
              <div className="success-reference">
                <span>Referência</span>
                <strong>{pix.reference}</strong>
              </div>
              <Link className="success-home" href="/">
                Voltar para SIGNUM 312
              </Link>
            </div>
          )}
        </section>

        <aside className="order-summary">
          <div className="summary-product">
            {variant === "duo" ? (
              <div className="summary-duo">
                <ProductVisual tone="patina" compact mode="real" />
                <ProductVisual tone="gold" compact mode="real" />
              </div>
            ) : (
              <ProductVisual
                tone={variant === "gold" ? "gold" : "patina"}
                compact
                mode="real"
              />
            )}
          </div>

          <div className="summary-copy">
            <span>SIGNUM 312</span>
            <h2>{product.edition}</h2>
            <p>{product.description}</p>
          </div>

          <div className="summary-row">
            <span>Produto</span>
            <strong>{formatBRL(product.price)}</strong>
          </div>
          <div className="summary-row">
            <span>Frete</span>
            <strong>Calculado na operação</strong>
          </div>
          <div className="summary-total">
            <span>Total do produto</span>
            <strong>{formatBRL(product.price)}</strong>
          </div>

          <div className="summary-trust">
            <p>✓ Pagamento PIX via XPAYMENTS</p>
            <p>✓ Identificação única do pedido</p>
            <p>✓ Verificação automática de confirmação</p>
          </div>

          <Link href={"/?variant=" + variant + "#oferta"} className="change-product">
            ← Alterar edição
          </Link>
        </aside>
      </div>
    </main>
  );
}
