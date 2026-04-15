'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

type PlanGateTooltipProps = {
  /** When true, children are wrapped with a non-interactive shell and tooltip. */
  gated: boolean;
  /** Short label (e.g. "Growth plan required"). */
  title: string;
  /** Why upgrading helps (native tooltip body). */
  reason: string;
  /** Help / plans anchor (default: plan comparison on Help). */
  helpHref?: string;
  children: ReactNode;
};

/**
 * Wraps plan-locked controls: hover shows upgrade reason; optional Help link for more detail.
 */
export function PlanGateTooltip({
  gated,
  title,
  reason,
  helpHref = '/help#help-plans',
  children,
}: PlanGateTooltipProps) {
  if (!gated) {
    return <>{children}</>;
  }
  const nativeTitle = `${title}\n\n${reason}`;
  return (
    <span
      className="gw-plan-gate-wrap"
      title={nativeTitle}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch', gap: 6, maxWidth: '100%' }}
    >
      <span style={{ pointerEvents: 'none', opacity: 0.55 }}>{children}</span>
      <span style={{ fontSize: 11, color: 'var(--ink3)', lineHeight: 1.35 }}>
        {title}. {reason}{' '}
        <Link href={helpHref} style={{ color: 'var(--sky)', fontWeight: 600 }}>
          Learn more
        </Link>
      </span>
    </span>
  );
}
