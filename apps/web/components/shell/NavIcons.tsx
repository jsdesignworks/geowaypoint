/** Spec §6 — sidebar icons (inline SVG). */

export function IconOverview({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="currentColor"
        d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
      />
    </svg>
  );
}

export function IconMaps({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="11" r="1.5" fill="currentColor" />
      <circle cx="15" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconAnalytics({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <polyline
        points="4 16 8 10 12 14 16 8 20 12"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

export function IconEmbed({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        d="M8 7l-4 5 4 5M16 7l4 5-4 5"
      />
    </svg>
  );
}

export function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="currentColor"
        d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.4-4.5c.1.5.1 1 .1 1.5s0 1-.1 1.5l2 1.6-1.9 3.3-2.4-1c-.5.4-1.1.7-1.7 1l-.4 2.6h-3.8l-.4-2.6c-.6-.3-1.2-.6-1.7-1l-2.4 1-1.9-3.3 2-1.6c-.1-.5-.1-1-.1-1.5s0-1 .1-1.5l-2-1.6 1.9-3.3 2.4 1c.5-.4 1.1-.7 1.7-1l.4-2.6h3.8l.4 2.6c.6.3 1.2.6 1.7 1l2.4-1 1.9 3.3-2 1.6z"
      />
    </svg>
  );
}

export function IconProfile({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        stroke="currentColor"
        strokeWidth="2"
        d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"
      />
    </svg>
  );
}

export function IconLoyalty({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2l2.9 6.7L22 9.8l-5.5 4.7L18.2 22 12 18.6 5.8 22l1.7-7.5L2 9.8l7.1-1.1L12 2z"
      />
    </svg>
  );
}

export function IconChevron({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        d="M14 6l-6 6 6 6"
      />
    </svg>
  );
}
