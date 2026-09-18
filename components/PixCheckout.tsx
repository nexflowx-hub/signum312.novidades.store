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
  expiresAt?: string | null;
  variant: VariantId;
  subtotal: number;
  shipping: number;
  amount: number;
  currency: "BRL";
  store: string;
};

type Customer = {
  name: string;
  email: string;
  document: string;
  phone: string;
};

type Shipping = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

type CheckoutConfig = {
  shippingConfigured: boolean;
  shippingCents: number | null;
  freeShipping: boolean;
  store: string;
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

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function formatCep(value: string) {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
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
    phone: "",
  });

  const [shipping, setShipping] = useState<Shipping>({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepMessage, setCepMessage] = useState("");
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

  const shippingValue = (config?.shippingCents ?? 0) / 100;
  const totalValue = product.price + shippingValue;

  useEffect(() => {
    let alive = true;

    async function loadConfig() {
      try {
        const response = await fetch("/api/checkout/config", {
          cache: "no-store",
        });
        const body = await response.json();

        if (alive && response.ok && body?.data) {
          setConfig(body.data);
        }
      } catch {
        if (alive) setConfig(null);
      } finally {
        if (alive) setConfigLoading(false);
      }
    }

    void loadConfig();

    track(
      "checkout_view",
      productPayload(variant, product.price, {
        currency: "BRL",
        payment_method: "pix",
        ...attribution,
      }),
    );

    return () => {
      alive = false;
    };
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
            reference: pix.reference,
          }),
        });

        const body = await response.json();

        if (response.ok && body?.data?.status === "paid") {
          if (pollingRef.current) window.clearInterval(pollingRef.current);

          setStep("paid");

          track(
            "purchase",
            productPayload(variant, pix.amount, {
              currency: "BRL",
              payment_method: "pix",
              order_reference: pix.reference,
              transaction_id: pix.transactionId,
              shipping_value: pix.shipping,
              ...attribution,
            }),
          );
        }
      } catch {
        // Uma falha transitória de polling não invalida o PIX já emitido.
      }

      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    };

    pollingRef.current = window.setInterval(poll, 4000);
    void poll();

    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, [step, pix, variant, customer, shipping, attribution]);

  async function lookupCep() {
    const cep = onlyDigits(shipping.cep);

    if (cep.length !== 8 || cepLoading) return;

    setCepLoading(true);
    setCepMessage("");

    try {
      const response = await fetch(
        "/api/address/cep?cep=" + encodeURIComponent(cep),
        { cache: "no-store" },
      );
      const body = await response.json();

      if (!response.ok || !body?.data) {
        throw new Error(body?.error?.message || "CEP não encontrado.");
      }

      setShipping((current) => ({
        ...current,
        cep: formatCep(cep),
        street: body.data.street || current.street,
        neighborhood: body.data.neighborhood || current.neighborhood,
        city: body.data.city || current.city,
        state: body.data.state || current.state,
      }));

      setCepMessage("Endereço localizado. Confira o número e os dados.");
    } catch (lookupError) {
      setCepMessage(
        lookupError instanceof Error
          ? lookupError.message
          : "Preencha o endereço manualmente.",
      );
    } finally {
      setCepLoading(false);
    }
  }

  async function createPix(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    if (!config?.shippingConfigured) {
      setError(
        "A política de frete ainda não está configurada. Nenhuma cobrança foi criada.",
      );
      setBusy(false);
      return;
    }

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
            phone: onlyDigits(customer.phone),
          },
          shipping: {
            ...shipping,
            cep: onlyDigits(shipping.cep),
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
        productPayload(variant, body.data.amount, {
          currency: "BRL",
          payment_method: "pix",
          order_reference: body.data.reference,
          shipping_value: body.data.shipping,
          store: body.data.store,
          ...attribution,
        }),
      );

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
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
      setError(
        "Não foi possível copiar automaticamente. Selecione o código abaixo.",
      );
    }
  }

  return (
    <main className="checkout-shell">
      <header className="checkout-topbar">
        <Link href="/" className="checkout-brand">
          <span>✦</span> SIGNUM <strong>312</strong>
        </Link>

        <div className="secure-mark">
          <span>●</span> Checkout protegido
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
                  <h1>Entrega e PIX</h1>
                  <p>
                    Informe os dados da compra. O QR Code só é gerado depois de
                    você conferir o total.
                  </p>
                </div>
              </div>

              <div className="currency-pill-row" aria-label="Moeda">
                <button className="currency-pill active" type="button">
                  <span>🇧🇷</span>
                  Brasil · BRL
                </button>

                <button
                  className="currency-pill disabled"
                  type="button"
                  disabled
                  title="Checkout NOVIDADES-EURO em preparação"
                >
                  <span>🇪🇺</span>
                  Europa · EUR
                </button>
              </div>

              <form className="checkout-form" onSubmit={createPix}>
                <fieldset className="checkout-fieldset">
                  <legend>
                    <span>1</span>
                    Seus dados
                  </legend>

                  <div className="checkout-fields two-columns">
                    <label className="span-2">
                      <span>Nome completo</span>
                      <input
                        type="text"
                        autoComplete="name"
                        placeholder="Nome e sobrenome"
                        value={customer.name}
                        onChange={(event) =>
                          setCustomer({ ...customer, name: event.target.value })
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
                        onChange={(event) =>
                          setCustomer({ ...customer, email: event.target.value })
                        }
                        required
                      />
                    </label>

                    <label>
                      <span>WhatsApp / telefone</span>
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(62) 99999-9999"
                        value={customer.phone}
                        onChange={(event) =>
                          setCustomer({
                            ...customer,
                            phone: formatPhone(event.target.value),
                          })
                        }
                        required
                      />
                    </label>

                    <label className="span-2">
                      <span>CPF ou CNPJ</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="000.000.000-00"
                        value={customer.document}
                        onChange={(event) =>
                          setCustomer({
                            ...customer,
                            document: formatDocument(event.target.value),
                          })
                        }
                        required
                      />
                      <small>
                        Usado pelo processamento PIX. O documento completo não é
                        exibido na página.
                      </small>
                    </label>
                  </div>
                </fieldset>

                <fieldset className="checkout-fieldset">
                  <legend>
                    <span>2</span>
                    Endereço de entrega
                  </legend>

                  <div className="checkout-fields two-columns">
                    <label>
                      <span>CEP</span>
                      <div className="input-with-action">
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          placeholder="00000-000"
                          value={shipping.cep}
                          onChange={(event) =>
                            setShipping({
                              ...shipping,
                              cep: formatCep(event.target.value),
                            })
                          }
                          onBlur={() => void lookupCep()}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => void lookupCep()}
                          disabled={cepLoading || onlyDigits(shipping.cep).length !== 8}
                        >
                          {cepLoading ? "..." : "Buscar"}
                        </button>
                      </div>
                      {cepMessage && <small>{cepMessage}</small>}
                    </label>

                    <label>
                      <span>Número</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="address-line2"
                        placeholder="123"
                        value={shipping.number}
                        onChange={(event) =>
                          setShipping({ ...shipping, number: event.target.value })
                        }
                        required
                      />
                    </label>

                    <label className="span-2">
                      <span>Rua / Avenida</span>
                      <input
                        type="text"
                        autoComplete="address-line1"
                        placeholder="Endereço"
                        value={shipping.street}
                        onChange={(event) =>
                          setShipping({ ...shipping, street: event.target.value })
                        }
                        required
                      />
                    </label>

                    <label>
                      <span>Bairro</span>
                      <input
                        type="text"
                        autoComplete="address-level3"
                        placeholder="Bairro"
                        value={shipping.neighborhood}
                        onChange={(event) =>
                          setShipping({
                            ...shipping,
                            neighborhood: event.target.value,
                          })
                        }
                        required
                      />
                    </label>

                    <label>
                      <span>Complemento</span>
                      <input
                        type="text"
                        autoComplete="address-line3"
                        placeholder="Apto, bloco... (opcional)"
                        value={shipping.complement}
                        onChange={(event) =>
                          setShipping({
                            ...shipping,
                            complement: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      <span>Cidade</span>
                      <input
                        type="text"
                        autoComplete="address-level2"
                        placeholder="Cidade"
                        value={shipping.city}
                        onChange={(event) =>
                          setShipping({ ...shipping, city: event.target.value })
                        }
                        required
                      />
                    </label>

                    <label>
                      <span>UF</span>
                      <input
                        type="text"
                        autoComplete="address-level1"
                        placeholder="GO"
                        maxLength={2}
                        value={shipping.state}
                        onChange={(event) =>
                          setShipping({
                            ...shipping,
                            state: event.target.value.toUpperCase(),
                          })
                        }
                        required
                      />
                    </label>
                  </div>
                </fieldset>

                <div className="checkout-price-box">
                  <div>
                    <span>Produto</span>
                    <strong>{formatBRL(product.price)}</strong>
                  </div>
                  <div>
                    <span>Frete</span>
                    <strong>
                      {configLoading
                        ? "..."
                        : config?.shippingConfigured
                          ? config.freeShipping
                            ? "Grátis"
                            : formatBRL(shippingValue)
                          : "Não configurado"}
                    </strong>
                  </div>
                  <div className="checkout-price-total">
                    <span>Total no PIX</span>
                    <strong>
                      {config?.shippingConfigured
                        ? formatBRL(totalValue)
                        : "—"}
                    </strong>
                  </div>
                </div>

                {error && (
                  <div className="checkout-error" role="alert">
                    <strong>Não conseguimos gerar o PIX.</strong>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  className="pay-button"
                  type="submit"
                  disabled={
                    busy ||
                    configLoading ||
                    !config?.shippingConfigured
                  }
                >
                  <span>
                    {busy ? "Gerando PIX..." : "Gerar PIX e pagar"}
                    <small>
                      Você verá o QR Code antes de sair desta página
                    </small>
                  </span>
                  <strong>
                    {config?.shippingConfigured
                      ? formatBRL(totalValue)
                      : "—"}
                  </strong>
                </button>

                <div className="checkout-security">
                  <span>◆</span>
                  <p>
                    A chave da Store <strong>NOVIDADES-BRL</strong> permanece
                    exclusivamente no servidor. O valor da cobrança é calculado
                    novamente no backend antes de chamar a API XPAYMENTS.
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
                  <h1>PIX pronto</h1>
                  <p>
                    Abra o app do seu banco e pague pelo QR Code ou PIX Copia e Cola.
                  </p>
                </div>
              </div>

              <div className="pix-card">
                <div className="pix-status">
                  <span className="pulse-dot" />
                  Aguardando confirmação
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
                  <strong>{formatBRL(pix.amount)}</strong>
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
                    <li>Confira o valor e conclua o pagamento.</li>
                  </ol>
                </div>

                <div className="payment-watcher">
                  <span className="watcher-spinner" />
                  Estamos verificando a confirmação automaticamente.
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
                O PIX foi confirmado. A referência abaixo identifica o pedido.
                A entrega será destinada ao endereço informado no checkout.
              </p>

              <div className="success-reference">
                <span>Referência</span>
                <strong>{pix.reference}</strong>
              </div>

              <div className="success-delivery">
                <span>Entrega</span>
                <strong>
                  {shipping.city} · {shipping.state}
                </strong>
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
            <strong>
              {configLoading
                ? "..."
                : config?.shippingConfigured
                  ? config.freeShipping
                    ? "Grátis"
                    : formatBRL(shippingValue)
                  : "Pendente"}
            </strong>
          </div>

          <div className="summary-total">
            <span>Total</span>
            <strong>
              {pix
                ? formatBRL(pix.amount)
                : config?.shippingConfigured
                  ? formatBRL(totalValue)
                  : "—"}
            </strong>
          </div>

          <div className="summary-trust">
            <p>✓ Store XPAYMENTS: NOVIDADES-BRL</p>
            <p>✓ Pagamento por PIX S2S</p>
            <p>✓ Confirmação automática da transação</p>
          </div>

          {step === "form" && (
            <Link
              href={"/?variant=" + variant + "#oferta"}
              className="change-product"
            >
              ← Alterar edição
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}
