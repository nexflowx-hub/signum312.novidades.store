import Link from "next/link";

export default function Returns() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/">← Voltar para SIGNUM 312</Link>
        <h1>Trocas e Devoluções</h1>
        <p>Última atualização: 18 de setembro de 2026.</p>
        <h2>Arrependimento</h2>
        <p>
          Em compras realizadas online, o consumidor pode exercer o direito de
          arrependimento dentro do prazo legal aplicável, contado conforme a
          legislação de consumo brasileira.
        </p>
        <h2>Produto com problema</h2>
        <p>
          Se o item chegar com defeito, divergência ou dano de transporte, entre
          em contato informando o número do pedido e, quando possível, fotos do
          produto e da embalagem.
        </p>
        <h2>Condições</h2>
        <p>
          As instruções de postagem ou coleta serão fornecidas pelo atendimento
          conforme o caso. Os dados operacionais finais devem ser publicados
          antes da abertura comercial.
        </p>
      </div>
    </main>
  );
}
