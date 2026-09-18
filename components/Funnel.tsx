"use client";

import { useEffect, useMemo, useState } from "react";
import { getAttribution, productPayload, track } from "@/lib/analytics";
import { formatBRL, variants, type VariantId } from "@/lib/products";
import { ProductVisual } from "./ProductVisual";

type HeroMessage = {
  kicker: string;
  line1: string;
  line2: string;
  lead: string;
  initialVariant: VariantId;
};

const DEFAULT_HERO: HeroMessage = {
  kicker: "ARTE&VIDA · COLLECTION I",
  line1: "Esta expressão atravessou",
  line2: "mais de 1.700 anos.",
  lead:
    "SIGNUM 312 é uma coleção contemporânea inspirada em fé, coragem e propósito — criada para quem prefere carregar significado.",
  initialVariant: "patina",
};

function messageForCampaign(params: URLSearchParams): HeroMessage {
  const creative = [
    params.get("utm_content"),
    params.get("creative"),
    params.get("ad"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (creative.includes("a2") || creative.includes("simbolo")) {
    return {
      kicker: "SIGNUM 312 · EDIÇÃO PÁTINA",
      line1: "Não é apenas",
      line2: "um colar. É um símbolo.",
      lead:
        "Uma peça de presença rústica, criada para representar aquilo que você escolhe levar consigo.",
      initialVariant: "patina",
    };
  }

  if (creative.includes("a3") || creative.includes("constantino")) {
    return {
      kicker: "ROMA · 312 d.C.",
      line1: "Um sinal antes",
      line2: "de uma batalha decisiva.",
      lead:
        "A tradição de Constantino atravessou séculos. SIGNUM 312 transforma esse universo simbólico numa peça contemporânea.",
      initialVariant: "patina",
    };
  }

  if (creative.includes("a4") || creative.includes("gold") || creative.includes("dour")) {
    return {
      kicker: "SIGNUM 312 · EDIÇÃO DOURADA",
      line1: "Alguns símbolos",
      line2: "não precisam de explicação.",
      lead:
        "Dourado envelhecido, cruz em relevo e uma presença discreta para usar todos os dias.",
      initialVariant: "gold",
    };
  }

  if (creative.includes("a5") || creative.includes("duo")) {
    return {
      kicker: "SIGNUM 312 · DUO",
      line1: "Duas versões.",
      line2: "Um mesmo significado.",
      lead:
        "Pátina e Dourada juntas — para escolher conforme o momento ou transformar a coleção em presente.",
      initialVariant: "duo",
    };
  }

  if (creative.includes("a6") || creative.includes("hoc-signo")) {
    return {
      kicker: "IN HOC SIGNO VINCES",
      line1: "Com este sinal",
      line2: "vencerás.",
      lead:
        "Uma expressão ligada há séculos à tradição cristã, reinterpretada numa coleção contemporânea.",
      initialVariant: "patina",
    };
  }

  return DEFAULT_HERO;
}

const trust = [
  ["Pagamento protegido", "PIX processado por XPAYMENTS"],
  ["Pedido identificado", "Referência única por compra"],
  ["7 dias para desistir", "Conforme regras do e-commerce"],
];

export default function Funnel() {
  const [selected, setSelected] = useState<VariantId>("patina");
  const [heroMessage, setHeroMessage] = useState<HeroMessage>(DEFAULT_HERO);
  const [sticky, setSticky] = useState(false);
  const [loading, setLoading] = useState(false);
  const variant = variants[selected];

  useEffect(() => {
    const url = new URL(window.location.href);
    const attribution = getAttribution();
    const campaignMessage = messageForCampaign(url.searchParams);
    const requestedVariant = url.searchParams.get("variant");

    const initialVariant: VariantId =
      requestedVariant === "gold" || requestedVariant === "duo" || requestedVariant === "patina"
        ? requestedVariant
        : campaignMessage.initialVariant;

    setHeroMessage(campaignMessage);
    setSelected(initialVariant);

    track("page_view", { page: "signum312", ...attribution });
    track(
      "view_content",
      productPayload(initialVariant, variants[initialVariant].price, attribution),
    );

    const onScroll = () => {
      const threshold = Math.max(520, window.innerHeight * 0.72);
      setSticky(window.scrollY > threshold);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const separateTotal = useMemo(
    () => variants.patina.price + variants.gold.price,
    [],
  );

  const duoSaving = separateTotal - variants.duo.price;

  function selectVariant(id: VariantId) {
    setSelected(id);
    track(
      "select_variant",
      productPayload(id, variants[id].price, getAttribution()),
    );
  }

  function checkout(id: VariantId = selected) {
    const chosen = variants[id];
    const attribution = getAttribution();

    track(
      "add_to_cart",
      productPayload(id, chosen.price, {
        currency: "BRL",
        ...attribution,
      }),
    );
    track(
      "initiate_checkout",
      productPayload(id, chosen.price, {
        currency: "BRL",
        payment_method: "pix",
        ...attribution,
      }),
    );

    setLoading(true);
    window.location.assign(
      "/checkout?variant=" + encodeURIComponent(id) + "&currency=BRL",
    );
  }

  return (
    <main>
      <section className="hero section-dark" id="top">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <div className="announcement">
          <div className="shell announcement-inner">
            <span>Compra online protegida</span>
            <i />
            <span>PIX via XPAYMENTS</span>
            <i />
            <span>Brasil</span>
          </div>
        </div>

        <nav className="topbar shell">
          <a className="brand" href="#top" aria-label="SIGNUM 312">
            <span className="brand-cross">✦</span>
            <span>
              SIGNUM <strong>312</strong>
            </span>
          </a>
          <div className="nav-actions">
            <a href="#oferta" className="nav-link">Edições</a>
            <a href="#historia" className="nav-link">A história</a>
          </div>
        </nav>

        <div className="hero-grid shell">
          <div className="hero-copy">
            <p className="eyebrow">{heroMessage.kicker}</p>
            <h1>
              {heroMessage.line1}
              <span>{heroMessage.line2}</span>
            </h1>

            <div className="latin-lockup">
              <p>IN HOC SIGNO VINCES</p>
              <span>Com este sinal vencerás.</span>
            </div>

            <p className="hero-lead">{heroMessage.lead}</p>

            <div className="hero-selector" aria-label="Escolha sua edição">
              <button
                className={selected === "patina" ? "active" : ""}
                onClick={() => selectVariant("patina")}
                type="button"
              >
                <span className="swatch swatch-patina" />
                <span>Pátina</span>
                <small>{formatBRL(variants.patina.price)}</small>
              </button>
              <button
                className={selected === "gold" ? "active" : ""}
                onClick={() => selectVariant("gold")}
                type="button"
              >
                <span className="swatch swatch-gold" />
                <span>Dourada</span>
                <small>{formatBRL(variants.gold.price)}</small>
              </button>
              <button
                className={selected === "duo" ? "active" : ""}
                onClick={() => selectVariant("duo")}
                type="button"
              >
                <span className="swatch swatch-duo" />
                <span>Duo</span>
                <small>{formatBRL(variants.duo.price)}</small>
              </button>
            </div>

            <div className="hero-buy">
              <div>
                <span className="price-label">Sua edição</span>
                <strong>{formatBRL(variant.price)}</strong>
              </div>
              <button
                className="cta cta-primary"
                onClick={() => checkout()}
                disabled={loading}
                type="button"
              >
                {loading ? "Abrindo checkout..." : "Comprar com PIX"}
                <span>→</span>
              </button>
            </div>

            <div className="hero-reassurance">
              <span>✓ Valor confirmado antes do pagamento</span>
              <span>✓ QR Code gerado no checkout</span>
            </div>
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

            <a className="real-photo-link" href="#produto-real">
              Ver fotografias reais <span>↓</span>
            </a>
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

      <section className="offer-section offer-section-first" id="oferta">
        <div className="shell">
          <div className="section-heading offer-heading">
            <div>
              <p className="eyebrow">ESCOLHA A SUA EDIÇÃO</p>
              <h2>Qual delas representa você?</h2>
            </div>
            <p>
              O desenho base é o mesmo. O acabamento muda completamente a presença da peça.
              No Duo, você recebe as duas versões com economia de {formatBRL(duoSaving)}.
            </p>
          </div>

          <div className="offer-grid">
            <OfferCard
              id="patina"
              selected={selected === "patina"}
              onSelect={selectVariant}
              onBuy={checkout}
              visual={<ProductVisual tone="patina" compact mode="real" />}
              badge="EDIÇÃO DESTAQUE"
            />

            <OfferCard
              id="gold"
              selected={selected === "gold"}
              onSelect={selectVariant}
              onBuy={checkout}
              visual={<ProductVisual tone="gold" compact mode="real" />}
            />

            <OfferCard
              id="duo"
              selected={selected === "duo"}
              onSelect={selectVariant}
              onBuy={checkout}
              visual={
                <div className="mini-duo">
                  <ProductVisual tone="patina" compact mode="real" />
                  <ProductVisual tone="gold" compact mode="real" />
                </div>
              }
              badge="MELHOR VALOR"
              note={
                "Economize " +
                formatBRL(duoSaving) +
                " · Separadas: " +
                formatBRL(separateTotal)
              }
            />
          </div>

          <p className="offer-footnote">
            O pagamento BRL é concluído por PIX no checkout próprio da SIGNUM 312.
          </p>
        </div>
      </section>

      <section className="story-section" id="historia">
        <div className="shell story-grid">
          <div className="story-year" aria-hidden="true">312</div>
          <div className="story-copy">
            <p className="eyebrow">ROMA · 312 d.C.</p>
            <h2>Um sinal antes de uma batalha decisiva.</h2>
            <p>
              A tradição cristã associa a campanha de Constantino contra Maxêncio
              a uma experiência religiosa anterior à Batalha da Ponte Mílvio.
              Ao longo dos séculos, essa tradição ficou ligada à expressão{" "}
              <strong>“In Hoc Signo Vinces”</strong> — “Com este sinal vencerás”.
            </p>
            <p>
              SIGNUM 312 não é uma relíquia nem uma reprodução arqueológica.
              É uma interpretação contemporânea desse universo simbólico:
              uma peça sobre aquilo que você escolhe levar consigo.
            </p>
            <a href="#produto-real" className="text-link">
              Ver a peça real <span>→</span>
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
              <p>Um objeto ganha valor quando representa algo maior que ele próprio.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="proof-section" id="produto-real">
        <div className="shell">
          <div className="proof-heading">
            <div>
              <p className="eyebrow">VEJA A PEÇA REAL</p>
              <h2>O acabamento muda. O símbolo permanece.</h2>
            </div>
            <p>
              Fotografias reais das duas versões atualmente em validação.
              A cor pode variar ligeiramente conforme iluminação e tela.
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

          <div className="proof-cta">
            <button
              className="cta cta-dark"
              type="button"
              onClick={() => checkout()}
              disabled={loading}
            >
              Escolher {variant.edition} · {formatBRL(variant.price)}
              <span>→</span>
            </button>
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
              A composição metálica e demais especificações técnicas devem ser
              confirmadas no lote comercial antes da abertura definitiva das vendas.
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
              A coleção foi pensada para funcionar tanto como escolha pessoal
              quanto como presente simbólico.
            </p>
          </div>

          <button
            className="cta cta-dark"
            type="button"
            onClick={() => {
              selectVariant("duo");
              document.querySelector("#oferta")?.scrollIntoView({ behavior: "smooth" });
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
            <Faq q="Como pago no Brasil?">
              O checkout BRL gera um PIX pela infraestrutura XPAYMENTS. Você pode
              pagar por QR Code ou PIX Copia e Cola.
            </Faq>
            <Faq q="Como funciona a entrega?">
              Prazo, modalidade de envio e política de frete serão apresentados
              antes da confirmação final da compra.
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
              type="button"
            >
              {loading ? "Abrindo checkout..." : "Comprar com PIX"} <span>→</span>
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
            <p>Uma experiência Arte&Vida · Novidades.store</p>
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
          <button onClick={() => checkout()} disabled={loading} type="button">
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

      {note && <small className="offer-note offer-note-positive">{note}</small>}

      <strong className="offer-price">{formatBRL(item.price)}</strong>

      <button
        className="choice-button"
        onClick={() => onSelect(id)}
        type="button"
      >
        {selected ? "✓ Edição selecionada" : "Selecionar edição"}
      </button>

      <button className="buy-link" onClick={() => onBuy(id)} type="button">
        Comprar com PIX →
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
