// Logo CollectFlow : un C et un F séparés, penchés, aux extrémités coupées net.
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
        transform="translate(16 16) skewX(-10) translate(-16 -16)"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.4"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      >
        <path d="M15.2 10.6A6.6 6.6 0 1 0 15.2 21.4" />
        <path d="M20.3 8.5V23.5" />
        <path d="M20.3 9.9H27M20.3 15.9H25.6" />
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
