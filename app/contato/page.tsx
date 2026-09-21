import Link from "next/link";

export default function Contact() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/">← Voltar para SIGNUM 312</Link>
        <h1>Contato</h1>
        <p>Atendimento SIGNUM 312 · Novidades.store.</p>
        <div className="contact-placeholder">
          <strong>Atendimento ao pedido</strong>
          <p>
            Para dúvidas sobre pagamento, entrega, troca ou devolução, tenha em
            mãos a referência exibida no checkout e utilize o canal de
            atendimento informado nas comunicações do seu pedido.
          </p>
        </div>
      </div>
    </main>
  );
}
