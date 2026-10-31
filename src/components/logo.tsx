// Logo CollectFlow : un C et un F séparés, penchés, aux bouts ronds comme un trait de stylo, en dégradé bleu.
// Le dessin est en SVG : net à toutes les tailles, aucune image à charger.
// `size` est la hauteur du symbole ; la largeur suit les proportions du dessin.
export function LogoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      height={size}
      width={(size * 666) / 522}
      viewBox="80 138 666 522"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient
          id="cf-mark-gradient"
          gradientUnits="userSpaceOnUse"
          x1="150"
          y1="150"
          x2="600"
          y2="645"
        >
          <stop offset="0" stopColor="#58A6FF" />
          <stop offset="0.55" stopColor="#2358D8" />
          <stop offset="1" stopColor="#14327F" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke="url(#cf-mark-gradient)"
        strokeWidth="88"
        strokeLinecap="round"
        strokeLinejoin="miter"
      >
        <path d="M455 188.5H312A181.5 181.5 0 0 0 244.0 538.3" />
        <path d="M342.7 610L456.7 297.5H696" />
        <path d="M404.7 440H602" />
      </g>
    </svg>
  );
}

export function Logo({
  size = 30,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="font-display text-2xl font-extrabold leading-none tracking-tight text-ink">
        Collect<span className="font-semibold text-brand">Flow</span>
      </span>
    </span>
  );
}
