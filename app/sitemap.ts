import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://signum312.novidades.store";

  return [
    { url: base, priority: 1 },
    { url: base + "/termos", priority: 0.3 },
    { url: base + "/privacidade", priority: 0.3 },
    { url: base + "/trocas-e-devolucoes", priority: 0.3 },
    { url: base + "/contato", priority: 0.3 },
  ];
}
