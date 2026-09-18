"use client";

import { useEffect, useMemo, useState } from "react";
import { getAttribution, productPayload, track } from "@/lib/analytics";
import { formatBRL, variants, type VariantId } from "@/lib/products";
import { ProductVisual } from "./ProductVisual";

const trust = [
  ["Compra protegida", "Fluxo de pagamento seguro"],
  ["Envio rastreável", "Acompanhamento após a expedição"],
  ["7 dias para desistir", "Conforme regras aplicáveis ao e-commerce"],
];

export default function Funnel() {
  const [selected, setSelected] = useState<VariantId>("patina");
  const [sticky, setSticky] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const variant = variants[selected];

  useEffect(() => {
    const attribution = getAttribution();
    track("page_view", { page: "signum312", ...attribution });
    track(
      "view_content",
      productPayload("patina", variants.patina.price, attribution),
    );

    const onScroll = () => setSticky(window.scrollY > 620);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const separateTotal = useMemo(
    () => variants.patina.price + variants.gold.price,
    [],
  );

  function selectVariant(id: VariantId) {
    setSelected(id);
    setCheckoutError("");
    track(
      "select_variant",
      productPayload(id, variants[id].price, getAttribution()),
    );
  }

  async function checkout(id: VariantId = selected) {
    setLoading(true);
    setCheckoutError("");

    const chosen = variants[id];
    const attribution = getAttribution();

    track(
      "add_to_cart",
      productPayload(id, chosen.price, attribution),
    );
    track(
      "initiate_checkout",
      productPayload(id, chosen.price, attribution),
    );

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant: id, attribution }),
      });

      const body = await response.json();
      if (!response.ok || !body.url) {
        throw new Error(body.message || "Checkout ainda não configurado.");
      }

      window.location.assign(body.url);
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir o checkout agora.",
      );
      document.querySelector("#oferta")?.scrollIntoView({ behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="hero section-dark">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <nav className="topbar shell">
          <a className="brand" href="#top" aria-label="SIGNUM 312">
            <span className="brand-cross">✦</span>
            <span>SIGNUM <strong>312</strong></span>
          </a>
          <a href="#historia" className="nav-link">A história</a>
        </nav>

        <div className="hero-grid shell" id="top">
          <div className="hero-copy">
            <p className="eyebrow">ARTE&VIDA · COLLECTION I</p>
            <h1>
              Esta frase atravessou
              <span>mais de 1.700 anos.</span>
            </h1>

            <div className="latin-lockup">
              <p>IN HOC SIGNO VINCES</p>
              <span>Com este sinal vencerás.</span>
            </div>

            <p className="hero-lead">
              Uma coleção contemporânea inspirada em fé, coragem e propósito —
              criada para quem prefere carregar significado.
            </p>

            <div className="hero-selector" aria-label="Escolha sua edição">
              <button
                className={selected === "patina" ? "active" : ""}
                onClick={() => selectVariant("patina")}
              >
                <span className="swatch swatch-patina" />
                Pátina
              </button>
              <button
                className={selected === "gold" ? "active" : ""}
                onClick={() => selectVariant("gold")}
              >
                <span className="swatch swatch-gold" />
                Dourada
              </button>
              <button
                className={selected === "duo" ? "active" : ""}
                onClick={() => selectVariant("duo")}
              >
                <span className="swatch swatch-duo" />
                Duo
              </button>
            </div>

            <div className="hero-buy">
              <div>
                <span className="price-label">Preço de lançamento</span>
                <strong>{formatBRL(variant.price)}</strong>
              </div>
              <button
                className="cta cta-primary"
                onClick={() => checkout()}
                disabled={loading}
              >
                {loading ? "Abrindo checkout..." : "Escolher o meu"}
                <span>→</span>
              </button>
            </div>

            <p className="microcopy">
              Frete calculado no checkout · PIX e cartão conforme disponibilidade
            </p>
          </div>

          <div
            className={
              "hero-product " +
              (selected === "gold"
                ? "is-gold"
                : selected === "duo"
                  ? "is-duo"
                  : "is-patina")
            }
          >
            {selected === "duo" ? (
              <div className="duo-visual">
                <ProductVisual tone="patina" />
                <ProductVisual tone="gold" compact />
              </div>
            ) : (
              <ProductVisual tone={selected === "gold" ? "gold" : "patina"} />
            )}
            <span className="visual-caption">
              Representação visual provisória · substituir por fotografia final
            </span>
          </div>
        </div>

        <div className="trust-strip shell">
          {trust.map(([title, text]) => (
            <div key={title}>
              <span className="trust-dot">◆</span>
              <p>
                <strong>{title}</strong>
                <small>{text}</small>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="story-section" id="historia">
        <div className="shell story-grid">
          <div className="story-year" aria-hidden="true">312</div>
          <div className="story-copy">
            <p className="eyebrow">ROMA · 312 d.C.</p>
            <h2>Um sinal antes de uma batalha decisiva.</h2>
            <p>
              A tradição cristã associa a campanha de Constantino contra
              Maxêncio a uma experiência religiosa anterior à Batalha da Ponte
              Mílvio. Ao longo dos séculos, essa tradição ficou ligada à
              expressão <strong>“In Hoc Signo Vinces”</strong> — “Com este sinal
              vencerás”.
            </p>
            <p>
              SIGNUM 312 não é uma relíquia nem uma reprodução arqueológica.
              É uma interpretação contemporânea desse universo simbólico:
              uma peça sobre aquilo que você escolhe levar consigo.
            </p>
            <a href="#oferta" className="text-link">
              Ver as duas edições <span>→</span>
            </a>
          </div>
        </div>
      </section>

      <section className="meaning-section section-dark">
        <div className="shell">
          <p className="eyebrow centered">TRÊS PALAVRAS. UM SÍMBOLO.</p>
          <h2 className="centered-title">Fé. Coragem. Propósito.</h2>

          <div className="meaning-grid">
            <article>
              <span>01</span>
              <h3>Fé</h3>
              <p>Um lembrete visual daquilo em que você escolhe acreditar.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Coragem</h3>
              <p>Não como promessa de vitória, mas como decisão de continuar.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Propósito</h3>
              <p>
                Um objeto ganha valor quando representa algo maior que ele próprio.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="offer-section" id="oferta">
        <div className="shell">
          <div className="section-heading">
            <p className="eyebrow">ESCOLHA A SUA EDIÇÃO</p>
            <h2>Duas interpretações. O mesmo significado.</h2>
            <p>
              Comece pela estética que mais representa você — ou leve as duas.
            </p>
          </div>

          <div className="offer-grid">
            <OfferCard
              id="patina"
              selected={selected === "patina"}
              onSelect={selectVariant}
              onBuy={checkout}
              visual={<ProductVisual tone="patina" compact />}
              badge="MAIS DISTINTIVA"
            />
            <OfferCard
              id="gold"
              selected={selected === "gold"}
              onSelect={selectVariant}
              onBuy={checkout}
              visual={<ProductVisual tone="gold" compact />}
            />
            <OfferCard
              id="duo"
              selected={selected === "duo"}
              onSelect={selectVariant}
              onBuy={checkout}
              visual={
                <div className="mini-duo">
                  <ProductVisual tone="patina" compact />
                  <ProductVisual tone="gold" compact />
                </div>
              }
              badge="MELHOR VALOR"
              note={"Separadamente: " + formatBRL(separateTotal)}
            />
          </div>

          {checkoutError && (
            <div className="checkout-notice" role="status">
              <strong>Checkout em configuração.</strong>
              <span>{checkoutError}</span>
            </div>
          )}
        </div>
      </section>

      <section className="proof-section">
        <div className="shell">
          <div className="proof-heading">
            <div>
              <p className="eyebrow">O PRODUTO REAL</p>
              <h2>Sem render esconder o que você recebe.</h2>
            </div>
            <p>
              Estas são fotografias reais das unidades do lote em teste.
              A apresentação final receberá novos packshots e embalagem própria,
              mas a peça que está sendo validada é esta.
            </p>
          </div>

          <div className="proof-grid">
            <figure>
              <div className="proof-photo">
                <ProductVisual tone="patina" mode="real" />
              </div>
              <figcaption>
                <strong>Edição Pátina</strong>
                <span>Acabamento escuro com nuances verde-pátina.</span>
              </figcaption>
            </figure>
            <figure>
              <div className="proof-photo">
                <ProductVisual tone="gold" mode="real" />
              </div>
              <figcaption>
                <strong>Edição Dourada</strong>
                <span>Dourado envelhecido e leitura mais clássica.</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="detail-section section-dark">
        <div className="shell detail-grid">
          <div className="detail-visual">
            <ProductVisual tone="patina" />
          </div>

          <div>
            <p className="eyebrow">FEITA PARA SER CARREGADA</p>
            <h2>Textura, contraste e imperfeições que dão identidade.</h2>
            <p className="detail-lead">
              O desenho irregular, a cruz central e o acabamento envelhecido
              criam uma presença que não depende de brilho excessivo.
            </p>

            <ul className="feature-list">
              <li><span>✓</span> Cruz central em relevo</li>
              <li><span>✓</span> Cordão preto ajustável</li>
              <li><span>✓</span> Acabamento visual envelhecido</li>
              <li><span>✓</span> Uso masculino ou unissexo</li>
              <li><span>✓</span> Edição Pátina ou Dourada</li>
            </ul>

            <p className="disclaimer">
              A composição metálica e especificações finais serão apresentadas
              conforme confirmação do fornecedor e do lote comercial.
            </p>
          </div>
        </div>
      </section>

      <section className="gift-section">
        <div className="shell gift-card">
          <div>
            <p className="eyebrow">PARA PRESENTEAR</p>
            <h2>Não ofereça apenas um acessório. Ofereça um significado.</h2>
            <p>
              SIGNUM 312 foi pensada para funcionar tanto como escolha pessoal
              quanto como presente simbólico.
            </p>
          </div>

          <button
            className="cta cta-dark"
            onClick={() => {
              selectVariant("duo");
              document
                .querySelector("#oferta")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Ver SIGNUM Duo <span>→</span>
          </button>
        </div>
      </section>

      <section className="faq-section">
        <div className="shell faq-grid">
          <div>
            <p className="eyebrow">ANTES DE ESCOLHER</p>
            <h2>Perguntas frequentes</h2>
          </div>

          <div className="faq-list">
            <Faq q="A medalha é antiga ou uma relíquia?">
              Não. SIGNUM 312 é uma peça contemporânea inspirada em simbolismo
              histórico e cristão.
            </Faq>
            <Faq q="Qual a diferença entre Pátina e Dourada?">
              O desenho base é o mesmo. A diferença está no acabamento visual:
              Pátina é mais escura e oxidada; Dourada tem leitura mais clássica.
            </Faq>
            <Faq q="O que vem no Duo?">
              Uma unidade Pátina e uma unidade Dourada no mesmo pedido.
            </Faq>
            <Faq q="Como funciona a entrega?">
              Prazo e valor são apresentados no checkout conforme o CEP e a
              modalidade disponível.
            </Faq>
            <Faq q="Posso desistir da compra?">
              Compras online seguem as regras de arrependimento aplicáveis ao
              comércio eletrônico. Consulte a página de Trocas e Devoluções.
            </Faq>
          </div>
        </div>
      </section>

      <section className="final-cta section-dark">
        <div className="shell final-grid">
          <div>
            <p className="eyebrow">SIGNUM 312</p>
            <h2>
              O símbolo permanece.
              <br />
              A escolha é sua.
            </h2>
          </div>

          <div className="final-buy">
            <p>{variant.edition}</p>
            <strong>{formatBRL(variant.price)}</strong>
            <button
              className="cta cta-primary"
              onClick={() => checkout()}
              disabled={loading}
            >
              {loading ? "Abrindo checkout..." : "Escolher agora"} <span>→</span>
            </button>
          </div>
        </div>
      </section>

      <footer>
        <div className="shell footer-grid">
          <div>
            <a className="brand footer-brand" href="#top">
              SIGNUM <strong>312</strong>
            </a>
            <p>Uma coleção Arte&Vida · Novidades.store</p>
          </div>

          <div className="footer-links">
            <a href="/termos">Termos</a>
            <a href="/privacidade">Privacidade</a>
            <a href="/trocas-e-devolucoes">Trocas e devoluções</a>
            <a href="/contato">Contato</a>
          </div>
        </div>
      </footer>

      {sticky && (
        <div className="sticky-buy" role="region" aria-label="Compra rápida">
          <div>
            <span>SIGNUM 312 · {variant.edition}</span>
            <strong>{formatBRL(variant.price)}</strong>
          </div>
          <button onClick={() => checkout()} disabled={loading}>
            {loading ? "..." : "Comprar"}
          </button>
        </div>
      )}
    </main>
  );
}

function OfferCard({
  id,
  selected,
  onSelect,
  onBuy,
  visual,
  badge,
  note,
}: {
  id: VariantId;
  selected: boolean;
  onSelect: (id: VariantId) => void;
  onBuy: (id: VariantId) => void;
  visual: React.ReactNode;
  badge?: string;
  note?: string;
}) {
  const item = variants[id];

  return (
    <article className={"offer-card " + (selected ? "selected" : "")}>
      {badge && <span className="offer-badge">{badge}</span>}
      <div className="offer-visual">{visual}</div>
      <p className="offer-eyebrow">{item.eyebrow}</p>
      <h3>{item.edition}</h3>
      <p>{item.description}</p>
      {note && <small className="offer-note">{note}</small>}
      <strong className="offer-price">{formatBRL(item.price)}</strong>

      <button className="choice-button" onClick={() => onSelect(id)}>
        {selected ? "✓ Selecionada" : "Selecionar"}
      </button>
      <button className="buy-link" onClick={() => onBuy(id)}>
        Comprar esta edição →
      </button>
    </article>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details>
      <summary>
        {q}
        <span>+</span>
      </summary>
      <p>{children}</p>
    </details>
  );
}
