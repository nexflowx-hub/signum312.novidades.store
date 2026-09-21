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
  kicker: "COLEÇÃO SIGNUM 312",
  line1: "Um símbolo para carregar",
  line2: "aquilo que não se vê.",
  lead:
    "Uma medalha contemporânea inspirada em fé, coragem e propósito — criada para acompanhar histórias que merecem permanecer.",
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
      line1: "Mais que um acessório.",
      line2: "Um símbolo.",
      lead:
        "Textura envelhecida, presença rústica e um significado escolhido por você.",
      initialVariant: "patina",
    };
  }

  if (creative.includes("a3") || creative.includes("constantino")) {
    return {
      kicker: "ROMA · 312 d.C.",
      line1: "Um símbolo atravessou",
      line2: "mais de dezessete séculos.",
      lead:
        "A tradição ligada a Constantino e à Batalha da Ponte Mílvio inspira uma leitura contemporânea sobre fé, coragem e propósito.",
      initialVariant: "patina",
    };
  }

  if (
    creative.includes("a4") ||
    creative.includes("gold") ||
    creative.includes("dour")
  ) {
    return {
      kicker: "SIGNUM 312 · EDIÇÃO DOURADA",
      line1: "Clássica na presença.",
      line2: "Pessoal no significado.",
      lead:
        "O acabamento dourado envelhecido dá à SIGNUM 312 uma leitura mais luminosa, sem perder a estética marcada pelo tempo.",
      initialVariant: "gold",
    };
  }

  if (creative.includes("a5") || creative.includes("duo")) {
    return {
      kicker: "SIGNUM 312 · DUO",
      line1: "Duas versões.",
      line2: "O mesmo significado.",
      lead:
        "Pátina e Dourada juntas: duas interpretações do mesmo símbolo, com vantagem no conjunto.",
      initialVariant: "duo",
    };
  }

  if (creative.includes("a6") || creative.includes("hoc-signo")) {
    return {
      kicker: "IN HOC SIGNO VINCES",
      line1: "Com este sinal",
      line2: "vencerás.",
      lead:
        "Uma expressão ligada há séculos à tradição cristã, reinterpretada em uma peça contemporânea para quem escolhe carregar significado.",
      initialVariant: "patina",
    };
  }

  return DEFAULT_HERO;
}

const trust = [
  ["Frete grátis", "Entrega para todo o Brasil"],
  ["PIX simples", "QR Code e Copia e Cola"],
  ["Compra online", "7 dias para arrependimento"],
];

const principles = [
  {
    number: "01",
    title: "Fé",
    text: "Um lembrete visual daquilo que orienta você, sem precisar ser explicado a ninguém.",
  },
  {
    number: "02",
    title: "Coragem",
    text: "Não como promessa de vitória, mas como decisão de continuar quando o caminho exige firmeza.",
  },
  {
    number: "03",
    title: "Propósito",
    text: "Porque um objeto ganha outra dimensão quando representa algo maior que o próprio objeto.",
  },
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
      requestedVariant === "gold" ||
      requestedVariant === "duo" ||
      requestedVariant === "patina"
        ? requestedVariant
        : campaignMessage.initialVariant;

    setHeroMessage(campaignMessage);
    setSelected(initialVariant);

    track("page_view", { page: "signum312", ...attribution });
    track(
      "view_content",
      productPayload(
        initialVariant,
        variants[initialVariant].price,
        attribution,
      ),
    );

    const onScroll = () => {
      setSticky(window.scrollY > Math.max(620, window.innerHeight * 0.78));
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
    <main className="funnel-v2">
      <section className="hero-v2" id="top">
        <div className="hero-v2-grain" aria-hidden="true" />
        <div className="hero-v2-orbit hero-v2-orbit-one" aria-hidden="true" />
        <div className="hero-v2-orbit hero-v2-orbit-two" aria-hidden="true" />

        <div className="announcement-v2">
          <div className="shell announcement-v2-inner">
            <span>Coleção SIGNUM 312</span>
            <i />
            <span>Oferta especial de lançamento</span>
            <i />
            <span>Frete grátis em todo o Brasil</span>
          </div>
        </div>

        <nav className="topbar-v2 shell" aria-label="Navegação principal">
          <a className="brand-v2" href="#top" aria-label="SIGNUM 312">
            <span className="brand-v2-sigil">✦</span>
            <span className="brand-v2-word">
              SIGNUM <strong>312</strong>
            </span>
          </a>

          <div className="nav-v2-actions">
            <a href="#edicoes">Edições</a>
            <a href="#historia">A história</a>
            <a href="#produto-real">A peça</a>
            <a href="#edicoes" className="nav-v2-cta">
              Escolher
            </a>
          </div>
        </nav>

        <div className="hero-v2-grid shell">
          <div className="hero-v2-copy">
            <p className="eyebrow-v2">{heroMessage.kicker}</p>

            <h1>
              {heroMessage.line1}
              <span>{heroMessage.line2}</span>
            </h1>

            <p className="hero-v2-lead">{heroMessage.lead}</p>

            <div className="hero-v2-quote">
              <span>IN HOC SIGNO VINCES</span>
              <small>Com este sinal vencerás.</small>
            </div>

            <div className="hero-v2-choices" aria-label="Escolha sua edição">
              {(["patina", "gold", "duo"] as VariantId[]).map((id) => (
                <button
                  key={id}
                  className={selected === id ? "active" : ""}
                  onClick={() => selectVariant(id)}
                  type="button"
                >
                  <span className={"choice-v2-swatch choice-v2-" + id} />
                  <span className="choice-v2-copy">
                    <strong>{variants[id].edition}</strong>
                    <small>
                      {id === "duo"
                        ? "Pátina + Dourada"
                        : id === "patina"
                          ? "Envelhecida"
                          : "Clássica"}
                    </small>
                  </span>
                  <span className="choice-v2-price choice-v3-price">
                    <del>{formatBRL(variants[id].compareAtPrice)}</del>
                    <strong>{formatBRL(variants[id].price)}</strong>
                  </span>
                </button>
              ))}
            </div>

            <div className="hero-v2-buy">
              <div className="hero-v2-price hero-v3-price">
                <span>Oferta atual</span>
                <del>{formatBRL(variant.compareAtPrice)}</del>
                <strong>{formatBRL(variant.price)}</strong>
                <small>
                  {selected === "duo"
                    ? "duas edições · economize " + formatBRL(duoSaving)
                    : "frete grátis para todo o Brasil"}
                </small>
              </div>

              <button
                className="cta-v2 cta-v2-primary"
                onClick={() => checkout()}
                disabled={loading}
                type="button"
              >
                <span>
                  {loading ? "Abrindo checkout..." : "Quero meu SIGNUM"}
                </span>
                <b aria-hidden="true">→</b>
              </button>
            </div>

            <div className="hero-v2-reassurance">
              <span>✓ Frete grátis em todo o Brasil</span>
              <span>✓ PIX por QR Code ou Copia e Cola</span>
              <span>✓ Valor final conferido antes do pagamento</span>
            </div>
          </div>

          <div className={"hero-v2-stage hero-v2-stage-" + selected}>
            <div className="hero-v2-halo" aria-hidden="true" />

            {selected === "duo" ? (
              <div className="hero-v2-duo">
                <div className="hero-v2-piece hero-v2-piece-patina">
                  <ProductVisual tone="patina" mode="real" priority />
                </div>
                <div className="hero-v2-piece hero-v2-piece-gold">
                  <ProductVisual tone="gold" mode="real" priority />
                </div>
              </div>
            ) : (
              <div className="hero-v2-single">
                <ProductVisual
                  tone={selected === "gold" ? "gold" : "patina"}
                  mode="real"
                  priority
                />
              </div>
            )}

            <div className="hero-v2-card hero-v2-card-top">
              <span>EDIÇÃO</span>
              <strong>{variant.edition}</strong>
            </div>

            <div className="hero-v2-card hero-v2-card-bottom">
              <span>COLEÇÃO</span>
              <strong>Fé · História · Propósito</strong>
            </div>

            <a className="hero-v2-detail-link" href="#produto-real">
              Ver a peça em detalhe <span>↓</span>
            </a>
          </div>
        </div>

        <div className="trust-v2 shell">
          {trust.map(([title, text]) => (
            <div key={title}>
              <span className="trust-v2-mark">✦</span>
              <p>
                <strong>{title}</strong>
                <small>{text}</small>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="collection-v2" id="edicoes">
        <div className="shell">
          <div className="collection-v2-heading">
            <div>
              <p className="eyebrow-v2">ESCOLHA O SEU SÍMBOLO</p>
              <h2>
                Duas interpretações.
                <br />
                Uma mesma origem.
              </h2>
            </div>
            <p>
              O desenho permanece. O acabamento muda a personalidade da peça.
              Escolha uma edição ou leve as duas no SIGNUM Duo.
            </p>
          </div>

          <div className="offer-v2-grid">
            <OfferCard
              id="patina"
              selected={selected === "patina"}
              onSelect={selectVariant}
              onBuy={checkout}
              visual={<ProductVisual tone="patina" compact mode="real" />}
              badge="PÁTINA ENVELHECIDA"
            />

            <OfferCard
              id="duo"
              selected={selected === "duo"}
              onSelect={selectVariant}
              onBuy={checkout}
              visual={
                <div className="offer-v2-duo">
                  <ProductVisual tone="patina" compact mode="real" />
                  <ProductVisual tone="gold" compact mode="real" />
                </div>
              }
              badge="DUAS EDIÇÕES"
              featured
              note={
                "Economize " +
                formatBRL(duoSaving) +
                " · separadas: " +
                formatBRL(separateTotal)
              }
            />

            <OfferCard
              id="gold"
              selected={selected === "gold"}
              onSelect={selectVariant}
              onBuy={checkout}
              visual={<ProductVisual tone="gold" compact mode="real" />}
              badge="DOURADA CLÁSSICA"
            />
          </div>

          <div className="collection-v2-foot">
            <span>Uma peça: {formatBRL(variants.gold.price)}</span>
            <i />
            <span>Duo: {formatBRL(variants.duo.price)}</span>
            <i />
            <span>Frete grátis para todo o Brasil</span>
          </div>
        </div>
      </section>

      <section className="heritage-v2" id="historia">
        <div className="heritage-v2-number" aria-hidden="true">
          312
        </div>

        <div className="shell heritage-v2-grid">
          <div className="heritage-v2-aside">
            <p className="eyebrow-v2">ROMA · 312 d.C.</p>
            <p className="heritage-v2-latin">
              IN HOC
              <br />
              SIGNO
              <br />
              VINCES
            </p>
            <span>“Com este sinal vencerás.”</span>
          </div>

          <div className="heritage-v2-copy">
            <p className="heritage-v2-kicker">A HISTÓRIA POR TRÁS DO NOME</p>
            <h2>Antes de ser uma peça, SIGNUM 312 é uma ideia.</h2>
            <p>
              A tradição cristã associa a campanha de Constantino contra
              Maxêncio a uma experiência religiosa anterior à Batalha da Ponte
              Mílvio, no ano de 312.
            </p>
            <p>
              Ao longo dos séculos, esse episódio ficou ligado à expressão
              <strong> “In Hoc Signo Vinces”</strong>. SIGNUM 312 parte desse
              universo simbólico para criar uma peça contemporânea — não uma
              relíquia, nem uma reprodução arqueológica.
            </p>

            <div className="heritage-v2-facts">
              <div>
                <span>312</span>
                <small>referência histórica</small>
              </div>
              <div>
                <span>2</span>
                <small>acabamentos</small>
              </div>
              <div>
                <span>1</span>
                <small>símbolo central</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="meaning-v2">
        <div className="shell">
          <div className="meaning-v2-heading">
            <p className="eyebrow-v2">O QUE VOCÊ ESCOLHE CARREGAR</p>
            <h2>Fé. Coragem. Propósito.</h2>
            <p>
              A SIGNUM 312 não tenta dizer o que o símbolo deve significar.
              Ela cria espaço para que o significado seja seu.
            </p>
          </div>

          <div className="meaning-v2-grid">
            {principles.map((item) => (
              <article key={item.title}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-v2">
        <div className="shell editorial-v2-inner">
          <span className="editorial-v2-mark">✦</span>
          <blockquote>
            “Não é sobre seguir uma tendência.
            <strong> É sobre carregar um significado.</strong>”
          </blockquote>
          <p>SIGNUM 312 · COLEÇÃO ARTE &amp; VIDA</p>
        </div>
      </section>

      <section className="proof-v2" id="produto-real">
        <div className="shell">
          <div className="proof-v2-heading">
            <div>
              <p className="eyebrow-v2">A PEÇA EM DETALHE</p>
              <h2>
                O acabamento muda.
                <br />
                O símbolo permanece.
              </h2>
            </div>
            <p>
              Veja as duas versões da coleção. A tonalidade pode variar
              ligeiramente conforme a iluminação e a tela utilizada.
            </p>
          </div>

          <div className="proof-v2-grid">
            <figure className="proof-v2-card proof-v2-card-patina">
              <div className="proof-v2-photo">
                <ProductVisual tone="patina" mode="real" />
              </div>
              <figcaption>
                <div>
                  <span>Edição</span>
                  <strong>Pátina</strong>
                </div>
                <p>Escura, envelhecida e com nuances verde-pátina.</p>
                <button type="button" onClick={() => checkout("patina")}>
                  Escolher Pátina · {formatBRL(variants.patina.price)}
                </button>
              </figcaption>
            </figure>

            <figure className="proof-v2-card proof-v2-card-gold">
              <div className="proof-v2-photo">
                <ProductVisual tone="gold" mode="real" />
              </div>
              <figcaption>
                <div>
                  <span>Edição</span>
                  <strong>Dourada</strong>
                </div>
                <p>
                  Dourado envelhecido com leitura mais clássica e luminosa.
                </p>
                <button type="button" onClick={() => checkout("gold")}>
                  Escolher Dourada · {formatBRL(variants.gold.price)}
                </button>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="detail-v2">
        <div className="shell detail-v2-grid">
          <div className="detail-v2-visual">
            <ProductVisual tone="patina" mode="real" />
            <div className="detail-v2-orbit" aria-hidden="true" />
          </div>

          <div className="detail-v2-copy">
            <p className="eyebrow-v2">PRESENÇA NOS DETALHES</p>
            <h2>Textura, contraste e uma estética feita para marcar.</h2>
            <p className="detail-v2-lead">
              O desenho irregular, a cruz central e os acabamentos envelhecidos
              criam uma presença visual que não depende de excesso.
            </p>

            <ul className="feature-v2-list">
              <li>
                <span>01</span>
                <div>
                  <strong>Cruz central em relevo</strong>
                  <small>O elemento que organiza toda a composição.</small>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Cordão preto ajustável</strong>
                  <small>Contraste sóbrio para uso no dia a dia.</small>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Acabamento visual envelhecido</strong>
                  <small>Pátina ou Dourada, com personalidade própria.</small>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <strong>Estética unissexo</strong>
                  <small>Uma peça concebida para diferentes estilos.</small>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="gift-v2">
        <div className="shell gift-v2-card">
          <div className="gift-v2-copy">
            <p className="eyebrow-v2">SIGNUM DUO</p>
            <h2>
              Uma para você.
              <br />
              Outra para alguém importante.
            </h2>
            <p>
              Ou simplesmente duas versões para dois momentos. O Duo reúne
              Pátina e Dourada no mesmo pedido por{" "}
              {formatBRL(variants.duo.price)}.
            </p>
            <div className="gift-v2-saving">
              <span>Preço anterior do Duo: {formatBRL(variants.duo.compareAtPrice)}</span>
              <strong>
                Hoje: {formatBRL(variants.duo.price)} · duas peças · frete grátis
              </strong>
              <small>
                Versus duas unidades na oferta atual, o Duo economiza {formatBRL(duoSaving)}.
              </small>
            </div>
          </div>

          <div className="gift-v2-duo">
            <ProductVisual tone="patina" compact mode="real" />
            <ProductVisual tone="gold" compact mode="real" />
          </div>

          <button
            className="cta-v2 cta-v2-dark gift-v2-cta"
            type="button"
            onClick={() => checkout("duo")}
            disabled={loading}
          >
            Escolher SIGNUM Duo <span>→</span>
          </button>
        </div>
      </section>

      <section className="purchase-v3">
        <div className="shell">
          <div className="purchase-v3-heading">
            <div>
              <p className="eyebrow-v2">COMPRA DIRETA, SEM RUÍDO</p>
              <h2>Escolha. Gere o PIX. Pronto.</h2>
            </div>
            <p>
              O checkout foi reduzido ao essencial: seus dados, endereço de
              entrega e a geração do QR Code para pagamento.
            </p>
          </div>

          <div className="purchase-v3-steps">
            <article>
              <span>01</span>
              <h3>Escolha a edição</h3>
              <p>Pátina, Dourada ou Duo. O preço promocional já aparece antes do checkout.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Informe a entrega</h3>
              <p>CEP, endereço e contato. O frete é grátis para todo o Brasil.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Gere o QR Code</h3>
              <p>Confira o total e gere o PIX. Você pode pagar pelo QR Code ou Copia e Cola.</p>
            </article>
          </div>

          <div className="purchase-v3-banner">
            <strong>Frete grátis Brasil</strong>
            <span>•</span>
            <strong>PIX em poucos passos</strong>
            <span>•</span>
            <strong>7 dias para arrependimento</strong>
          </div>
        </div>
      </section>

      <section className="faq-v2">
        <div className="shell faq-v2-grid">
          <div className="faq-v2-intro">
            <p className="eyebrow-v2">ANTES DE ESCOLHER</p>
            <h2>Perguntas frequentes.</h2>
            <p>
              Informações claras antes da compra — sem letras pequenas
              escondendo o que importa.
            </p>
          </div>

          <div className="faq-v2-list">
            <Faq q="A SIGNUM 312 é uma peça antiga ou uma relíquia?">
              Não. É uma peça contemporânea inspirada em simbolismo histórico e
              cristão. Não é uma relíquia nem uma reprodução arqueológica.
            </Faq>
            <Faq q="Qual é a diferença entre Pátina e Dourada?">
              O desenho base é o mesmo. A diferença está no acabamento visual:
              Pátina é mais escura e envelhecida; Dourada tem leitura mais
              clássica e luminosa.
            </Faq>
            <Faq q="O que recebo no SIGNUM Duo?">
              Uma unidade da Edição Pátina e uma unidade da Edição Dourada no
              mesmo pedido.
            </Faq>
            <Faq q="Como funciona o pagamento?">
              No Brasil, o checkout gera um PIX. Você pode pagar por QR Code ou
              PIX Copia e Cola, com o valor total apresentado antes da geração.
            </Faq>
            <Faq q="Como funciona a entrega?">
              O frete é grátis para todo o Brasil. No checkout você informa o
              endereço de entrega e confere o valor final antes de gerar o PIX.
            </Faq>
            <Faq q="Posso desistir da compra?">
              Compras online seguem o direito de arrependimento aplicável ao
              comércio eletrônico. Consulte a página de Trocas e Devoluções.
            </Faq>
          </div>
        </div>
      </section>

      <section className="final-v2">
        <div className="shell final-v2-grid">
          <div className="final-v2-copy">
            <p className="eyebrow-v2">SIGNUM 312</p>
            <h2>
              O símbolo permanece.
              <br />
              A escolha é sua.
            </h2>
            <p>
              Selecione a edição que mais representa você e conclua a compra
              com PIX no checkout da loja.
            </p>
          </div>

          <div className="final-v2-buy">
            <span>{variant.edition}</span>
            <del className="final-v3-old-price">{formatBRL(variant.compareAtPrice)}</del>
            <strong>{formatBRL(variant.price)}</strong>
            <button
              className="cta-v2 cta-v2-primary"
              onClick={() => checkout()}
              disabled={loading}
              type="button"
            >
              {loading ? "Abrindo checkout..." : "Quero meu SIGNUM"}{" "}
              <b>→</b>
            </button>
          </div>
        </div>
      </section>

      <footer className="footer-v2">
        <div className="shell footer-v2-grid">
          <div>
            <a className="brand-v2" href="#top">
              <span className="brand-v2-sigil">✦</span>
              <span>
                SIGNUM <strong>312</strong>
              </span>
            </a>
            <p>Uma experiência Arte &amp; Vida · Novidades.store</p>
          </div>

          <div className="footer-v2-links">
            <a href="/termos">Termos</a>
            <a href="/privacidade">Privacidade</a>
            <a href="/trocas-e-devolucoes">Trocas e devoluções</a>
            <a href="/contato">Contato</a>
          </div>
        </div>
      </footer>

      {sticky && (
        <div className="sticky-v2" role="region" aria-label="Compra rápida">
          <div>
            <span>SIGNUM 312 · {variant.edition}</span>
            <small className="sticky-v3-old">{formatBRL(variant.compareAtPrice)}</small>
            <strong>{formatBRL(variant.price)}</strong>
          </div>
          <button onClick={() => checkout()} disabled={loading} type="button">
            {loading ? "..." : "Escolher"}
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
  featured = false,
}: {
  id: VariantId;
  selected: boolean;
  onSelect: (id: VariantId) => void;
  onBuy: (id: VariantId) => void;
  visual: React.ReactNode;
  badge?: string;
  note?: string;
  featured?: boolean;
}) {
  const item = variants[id];

  return (
    <article
      className={
        "offer-v2-card " +
        (selected ? "selected " : "") +
        (featured ? "featured" : "")
      }
    >
      <div className="offer-v2-head">
        <span>{badge}</span>
        {selected && <b>Selecionada</b>}
      </div>

      <div className="offer-v2-visual">{visual}</div>

      <div className="offer-v2-copy">
        <p className="offer-v2-eyebrow">{item.eyebrow}</p>
        <h3>{item.edition}</h3>
        <p>{item.description}</p>

        {note && <small className="offer-v2-note">{note}</small>}

        <div className="offer-v2-price-row">
          <div className="offer-v3-price-stack">
            <del>{formatBRL(item.compareAtPrice)}</del>
            <strong>{formatBRL(item.price)}</strong>
          </div>
          <span>frete grátis</span>
        </div>

        <button
          className="offer-v2-select"
          onClick={() => onSelect(id)}
          type="button"
        >
          {selected ? "✓ Edição selecionada" : "Selecionar edição"}
        </button>

        <button
          className="offer-v2-buy"
          onClick={() => onBuy(id)}
          type="button"
        >
          Comprar agora <span>→</span>
        </button>
      </div>
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
