'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  IconAnalytics,
  IconChevron,
  IconEmbed,
  IconLoyalty,
  IconMaps,
  IconOverview,
  IconProfile,
  IconSettings,
} from '@/components/shell/NavIcons';
import { Toaster } from '@/components/shell/Toaster';
import { NotificationBell } from '@/components/shell/NotificationBell';

const LS_KEY = 'gw_sb_collapsed';

type ResortRow = {
  id: string;
  name: string;
  plan: string;
  trial_ends_at: string | null;
};

type AppShellProps = {
  userEmail: string;
  resort: ResortRow | null;
  children: React.ReactNode;
};

const nav = [
  { href: '/overview', label: 'Overview', dataLabel: 'Overview', Icon: IconOverview },
  { href: '/maps', label: 'Maps', dataLabel: 'Maps', Icon: IconMaps },
  { href: '/analytics', label: 'Analytics', dataLabel: 'Analytics', Icon: IconAnalytics },
  { href: '/embed', label: 'Embed & API', dataLabel: 'Embed & API', Icon: IconEmbed },
  { type: 'sep' as const },
  { href: '/settings', label: 'Settings', dataLabel: 'Settings', Icon: IconSettings },
  { href: '/profile', label: 'My Profile', dataLabel: 'My Profile', Icon: IconProfile },
  { href: '/loyalty', label: 'Loyalty & Referrals', dataLabel: 'Loyalty & Referrals', Icon: IconLoyalty },
];

export function AppShell({ userEmail, resort, children }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      setCollapsed(localStorage.getItem(LS_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  const setCollapsedPersist = useCallback((v: boolean) => {
    setCollapsed(v);
    try {
      localStorage.setItem(LS_KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const showTooltip = useCallback((el: HTMLElement, text: string) => {
    const tip = tooltipRef.current;
    if (!tip || !collapsed) return;
    const r = el.getBoundingClientRect();
    tip.textContent = text;
    tip.style.left = `${r.right + 8}px`;
    tip.style.top = `${r.top + r.height / 2}px`;
    tip.style.transform = 'translateY(-50%)';
    tip.classList.add('visible');
  }, [collapsed]);

  const hideTooltip = useCallback(() => {
    tooltipRef.current?.classList.remove('visible');
  }, []);

  const trialDaysLeft =
    resort?.plan === 'trial' && resort.trial_ends_at
      ? Math.max(
          0,
          Math.floor(
            (new Date(resort.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        )
      : null;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (!mounted) {
    return (
      <div className="app-root" style={{ background: 'var(--paper)' }}>
        <div style={{ padding: 28 }}>Loading…</div>
      </div>
    );
  }

  return (
    <>
      <div className="app-root">
        <aside className={`app-sidebar${collapsed ? ' collapsed' : ''}`}>
          <div className="sidebar-top">
            <div className="sidebar-brand">
              <span className="sidebar-brand-text">GeoWaypoint</span>
            </div>
          </div>
          <div className="sidebar-resort">
            <div className="resort-pill sidebar-resort-detail">
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--canopy)',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {resort?.name ?? 'Resort'}
                </div>
                <div style={{ opacity: 0.75, fontSize: 11 }}>
                  {resort?.plan === 'trial' ? 'trial' : resort?.plan ?? 'starter'}
                </div>
              </div>
            </div>
          </div>
          <nav className="sidebar-nav">
            {nav.map((item, i) =>
              item.type === 'sep' ? (
                <div key={`sep-${i}`} className="sidebar-sep" />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item${pathname === item.href || pathname.startsWith(item.href + '/') ? ' active' : ''}`}
                  data-label={item.dataLabel}
                  onMouseEnter={(e) => showTooltip(e.currentTarget, item.label)}
                  onMouseLeave={hideTooltip}
                >
                  <item.Icon className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </Link>
              )
            )}
            <button
              type="button"
              className="nav-item sb-toggle-btn"
              data-label="Collapse"
              onMouseEnter={(e) => showTooltip(e.currentTarget, collapsed ? 'Expand' : 'Collapse')}
              onMouseLeave={hideTooltip}
              onClick={() => setCollapsedPersist(!collapsed)}
            >
              <IconChevron className="nav-icon chevron" />
              <span className="nav-label">Collapse</span>
            </button>
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-bottom-detail" style={{ opacity: 0.85 }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</div>
            </div>
            <button
              type="button"
              className="nav-item"
              style={{ marginTop: 8, paddingLeft: collapsed ? 10 : 16 }}
              onClick={() => void signOut()}
            >
              <span className="nav-label">Sign out</span>
            </button>
          </div>
        </aside>
        <div className="app-main">
          {trialDaysLeft !== null && (
            <div className="trial-banner">
              <span>
                Trial: <strong>{trialDaysLeft}</strong> day{trialDaysLeft === 1 ? '' : 's'} left — full Pro
                access.
              </span>
              <Link href="/settings" className="btn btn-primary" style={{ padding: '6px 14px' }}>
                Upgrade Now
              </Link>
            </div>
          )}
          <header className="topbar">
            <h1
              className="font-serif-heading"
              style={{ fontSize: '1.35rem', margin: 0, flex: 1 }}
            >
              {pathname.startsWith('/editor')
                ? 'Map Editor'
                : nav.find((n) => 'href' in n && (pathname === n.href || pathname.startsWith(`${n.href}/`)))
                    ?.label ?? 'GeoWaypoint'}
            </h1>
            <NotificationBell />
          </header>
          <div className="page-body">{children}</div>
        </div>
      </div>
      <div id="gwSbTooltip" ref={tooltipRef} />
      <Toaster />
    </>
  );
}
