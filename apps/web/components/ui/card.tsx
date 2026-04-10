import type { HTMLAttributes } from 'react';

export type CardProps = HTMLAttributes<HTMLDivElement>;

/** Spec §3 — `.card` (avoid overflow:hidden on root card per spec). */
export function Card({ className = '', ...props }: CardProps) {
  return <div className={`card ${className}`.trim()} {...props} />;
}
