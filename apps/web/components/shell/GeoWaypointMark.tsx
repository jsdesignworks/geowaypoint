/** Staging HTML brand mark — RV + map pin motif */
export function GeoWaypointMark({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="2" y="11" width="18" height="9" rx="2" fill="white" opacity="0.9" />
      <circle cx="6.5" cy="18" r="2.2" fill="#4A9B5F" />
      <circle cx="15.5" cy="18" r="2.2" fill="#4A9B5F" />
      <path
        d="M2 12L7 6h8l5 6"
        stroke="white"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}
