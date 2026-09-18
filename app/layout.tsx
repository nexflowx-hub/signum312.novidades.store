import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://signum312.novidades.store";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SIGNUM 312 — Um símbolo que atravessa o tempo",
  description:
    "SIGNUM 312: medalhas contemporâneas inspiradas em fé, coragem, propósito e na tradição de In Hoc Signo Vinces.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "SIGNUM 312",
    description: "Um símbolo que atravessa o tempo.",
    url: siteUrl,
    siteName: "SIGNUM 312",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  const metaPixelScript = pixelId
    ? "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','" +
      pixelId +
      "');"
    : "";

  const gtmScript = gtmId
    ? "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','" +
      gtmId +
      "');"
    : "";

  return (
    <html lang="pt-BR">
      <body>
        {children}
        {pixelId && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {metaPixelScript}
          </Script>
        )}
        {gtmId && (
          <Script id="gtm" strategy="afterInteractive">
            {gtmScript}
          </Script>
        )}
      </body>
    </html>
  );
}
