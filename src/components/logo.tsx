// Logo CollectFlow : un « C » ouvert dans lequel entre un point (le paiement qui rentre).
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
      <path
        d="M21.745 11.179A7.5 7.5 0 1 0 21.745 20.821"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="23.5" cy="16" r="2.2" fill="#FFFFFF" />
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
