import Link from "next/link";

export default function Privacy() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/">← Voltar para SIGNUM 312</Link>
        <h1>Política de Privacidade</h1>
        <p>Última atualização: 18 de setembro de 2026.</p>
        <h2>Dados tratados</h2>
        <p>
          Podemos tratar dados necessários à navegação, atribuição de campanhas,
          atendimento, checkout, pagamento e entrega. Isso pode incluir
          identificadores técnicos, UTMs e dados fornecidos durante a compra.
        </p>
        <h2>Finalidades</h2>
        <p>
          Os dados são utilizados para operar a experiência de compra, medir
          campanhas, prevenir fraude, atender solicitações e cumprir obrigações
          legais.
        </p>
        <h2>Terceiros</h2>
        <p>
          Provedores de pagamento, analytics, hospedagem e logística podem tratar
          dados quando necessário à prestação de seus serviços.
        </p>
        <h2>Direitos</h2>
        <p>
          Solicitações relativas a dados pessoais podem ser encaminhadas pelo
          canal indicado na página de Contato.
        </p>
      </div>
    </main>
  );
}
