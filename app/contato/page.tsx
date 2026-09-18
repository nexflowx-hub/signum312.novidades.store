import Link from "next/link";

export default function Contact() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/">← Voltar para SIGNUM 312</Link>
        <h1>Contato</h1>
        <p>Atendimento do ecossistema Arte&Vida / Novidades.store.</p>
        <div className="contact-placeholder">
          <strong>Canal de atendimento</strong>
          <p>
            Os dados finais de WhatsApp e e-mail serão publicados antes da
            ativação das campanhas pagas.
          </p>
        </div>
      </div>
    </main>
  );
}
