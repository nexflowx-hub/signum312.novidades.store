type Props = {
  tone: "patina" | "gold";
  compact?: boolean;
};

export function ProductVisual({ tone, compact = false }: Props) {
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
