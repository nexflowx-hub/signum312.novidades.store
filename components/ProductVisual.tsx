import Image from "next/image";

type Props = {
  tone: "patina" | "gold";
  compact?: boolean;
};

export function ProductVisual({ tone, compact = false }: Props) {
  const src = tone === "patina" ? "/product-patina.webp" : "/product-gold.webp";
  const label = tone === "patina" ? "SIGNUM 312 Edição Pátina" : "SIGNUM 312 Edição Dourada";

  return (
    <div
      className={"product-photo " + tone + (compact ? " compact" : "")}
      aria-label={label}
    >
      <div className="product-photo-frame">
        <Image
          src={src}
          alt={label}
          width={300}
          height={411}
          priority={!compact}
          sizes={compact ? "220px" : "(max-width: 680px) 76vw, 430px"}
        />
      </div>
      <div className="product-photo-glow" aria-hidden="true" />
    </div>
  );
}
