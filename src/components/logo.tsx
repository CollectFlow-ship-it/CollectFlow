// Logo CollectFlow : un C et un F reliés par un seul trait, légèrement penché.
// Le bas du C se relève pour devenir la tige du F : l'argent suit le même chemin.
// Le dessin est en SVG : net à toutes les tailles, aucune image à charger.
export function LogoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#1E40AF" />
      <g
        transform="translate(16 16) skewX(-9) translate(-16 -16)"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M26.5 9.5H16A6.5 6.5 0 0 0 16 22.5H18.5C21 22.5 21.5 21 21.5 19V9.5" />
        <path d="M21.5 16H26.5" />
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
