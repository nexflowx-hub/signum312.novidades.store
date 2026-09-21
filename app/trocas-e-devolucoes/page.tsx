import Link from "next/link";

export default function Returns() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/">← Voltar para SIGNUM 312</Link>
        <h1>Trocas e Devoluções</h1>
        <p>Última atualização: 21 de setembro de 2026.</p>

        <h2>Direito de arrependimento</h2>
        <p>
          Nas compras realizadas online, o consumidor pode exercer o direito de
          arrependimento dentro do prazo legal aplicável, contado conforme a
          legislação brasileira de consumo.
        </p>

        <h2>Produto com problema</h2>
        <p>
          Se o item chegar com defeito, divergência ou dano de transporte,
          entre em contato informando a referência do pedido e, quando
          possível, envie fotos do produto e da embalagem.
        </p>

        <h2>Procedimento</h2>
        <p>
          Após a solicitação, o atendimento orientará os próximos passos de
          postagem, coleta, troca ou reembolso conforme o caso e a legislação
          aplicável.
        </p>
      </div>
    </main>
  );
}
