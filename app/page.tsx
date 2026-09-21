import Funnel from "@/components/Funnel";
import { variants } from "@/lib/products";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://signum312.novidades.store";

export default function Home() {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "SIGNUM 312",
    description:
      "Medalha contemporânea com cruz em relevo, cordão preto ajustável e opções de acabamento Pátina, Dourada ou Duo.",
    brand: {
      "@type": "Brand",
      name: "SIGNUM 312",
    },
    image: [
      siteUrl + "/product-patina.webp",
      siteUrl + "/product-gold.webp",
    ],
    offers: [
      {
        "@type": "Offer",
        sku: "SIGNUM312-PATINA",
        name: "SIGNUM 312 — Edição Pátina",
        priceCurrency: "BRL",
        price: variants.patina.price.toFixed(2),
        url: siteUrl + "/?variant=patina",
      },
      {
        "@type": "Offer",
        sku: "SIGNUM312-DOURADA",
        name: "SIGNUM 312 — Edição Dourada",
        priceCurrency: "BRL",
        price: variants.gold.price.toFixed(2),
        url: siteUrl + "/?variant=gold",
      },
      {
        "@type": "Offer",
        sku: "SIGNUM312-DUO",
        name: "SIGNUM 312 — Duo",
        priceCurrency: "BRL",
        price: variants.duo.price.toFixed(2),
        url: siteUrl + "/?variant=duo",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Funnel />
    </>
  );
}
