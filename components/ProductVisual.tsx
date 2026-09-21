import Image from "next/image";

type Props = {
  tone: "patina" | "gold";
  compact?: boolean;
  mode?: "cinematic" | "real";
  priority?: boolean;
};

export function ProductVisual({
  tone,
  compact = false,
  mode = "cinematic",
  priority = false,
}: Props) {
  const src =
    tone === "patina" ? "/product-patina.webp" : "/product-gold.webp";
  const label =
    tone === "patina"
      ? "SIGNUM 312 Edição Pátina"
      : "SIGNUM 312 Edição Dourada";

  return (
    <div
      className={
        "product-photo-v2 " +
        tone +
        " " +
        mode +
        (compact ? " compact" : "")
      }
    >
      <div className="product-photo-v2-frame">
        <Image
          src={src}
          alt={label}
          width={600}
          height={822}
          sizes={
            compact
              ? "(max-width: 680px) 42vw, 260px"
              : "(max-width: 680px) 82vw, 460px"
          }
          priority={priority}
        />
      </div>
      <div className="product-photo-v2-glow" aria-hidden="true" />
    </div>
  );
}
