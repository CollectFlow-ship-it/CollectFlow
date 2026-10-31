// Logo CollectFlow : un C et un F séparés, penchés, aux coupes parallèles, en dégradé bleu.
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
      width={(size * 630) / 495}
      viewBox="90 150 630 495"
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
      <path
        fill="url(#cf-mark-gradient)"
        d="M500 155H312A215 215 0 0 0 265 578L288 516A148 148 0 0 1 312 222H470Z"
      />
      <path
        fill="url(#cf-mark-gradient)"
        d="M258 642H332L394 472H580L612 408H417L446 330H675L712 265H396Z"
      />
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
