import Link from "next/link";

export default function Terms() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/">← Voltar para SIGNUM 312</Link>
        <h1>Termos de Uso e Compra</h1>
        <p>Última atualização: 18 de setembro de 2026.</p>
        <h2>1. Objeto</h2>
        <p>
          Esta página apresenta produtos comercializados no ecossistema
          Novidades.store. Preço, disponibilidade, frete e meios de pagamento
          são confirmados no fluxo de compra.
        </p>
        <h2>2. Produto</h2>
        <p>
          SIGNUM 312 é um acessório contemporâneo inspirado em simbolismo
          histórico. Não é apresentado como relíquia, artefato arqueológico ou
          objeto pertencente a personagem histórico.
        </p>
        <h2>3. Pagamento e entrega</h2>
        <p>
          As condições aplicáveis são mostradas no checkout. O pedido é
          considerado confirmado após aprovação do pagamento.
        </p>
        <h2>4. Propriedade intelectual</h2>
        <p>
          Marca, identidade visual, textos e materiais próprios do site não
          podem ser reproduzidos comercialmente sem autorização.
        </p>
        <h2>5. Contato</h2>
        <p>
          Utilize a página de Contato para solicitações relativas a pedidos,
          entrega, trocas ou informações sobre o produto.
        </p>
      </div>
    </main>
  );
}
