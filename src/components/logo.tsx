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
      width={(size * 610) / 502}
      viewBox="90 148 610 502"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient
          id="cf-mark-gradient"
          gradientUnits="userSpaceOnUse"
          x1="150"
          y1="150"
          x2="560"
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
        strokeWidth="67"
        strokeLinecap="round"
        strokeLinejoin="miter"
      >
        <path d="M470 188.5H312A181.5 181.5 0 0 0 249.9 540.5" />
        <path d="M306.7 610L420.7 297.5H660" />
        <path d="M368.7 440H566" />
      </g>
    </svg>
  );
}

export function Logo({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="font-display text-xl font-extrabold leading-none tracking-tight text-ink">
        Collect<span className="font-semibold text-brand">Flow</span>
      </span>
    </span>
  );
}
