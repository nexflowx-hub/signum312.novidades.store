import Image from "next/image";

type Props = {
  tone: "patina" | "gold";
  compact?: boolean;
  mode?: "cinematic" | "real";
};

export function ProductVisual({
  tone,
  compact = false,
  mode = "cinematic",
}: Props) {
  const src = tone === "patina" ? "/product-patina.webp" : "/product-gold.webp";
  const label =
    tone === "patina"
      ? "SIGNUM 312 Edição Pátina"
      : "SIGNUM 312 Edição Dourada";

  if (mode === "real") {
    return (
      <div
        className={"product-photo " + tone + (compact ? " compact" : "")}
        aria-label={label}
      >
        <div className="product-photo-frame">
          <Image
            src={src}
            alt={"Fotografia real — " + label}
            width={300}
            height={411}
            sizes={compact ? "220px" : "(max-width: 680px) 78vw, 430px"}
          />
        </div>
        <div className="product-photo-glow" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className={"product-visual " + tone + (compact ? " compact" : "")}
      aria-hidden="true"
    >
      <div className="cord cord-left" />
      <div className="cord cord-right" />
      <div className="connector">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="bail" />
      <div className="medallion">
        <div className="medallion-rim">
          <span className="glyph g1">I</span>
          <span className="glyph g2">N</span>
          <span className="glyph g3">H</span>
          <span className="glyph g4">O</span>
          <span className="glyph g5">C</span>
          <span className="glyph g6">V</span>
          <span className="glyph g7">I</span>
          <span className="glyph g8">N</span>
        </div>
        <div className="cross-mark">
          <i />
          <b />
        </div>
      </div>
      <div className="product-shadow" />
    </div>
  );
}
