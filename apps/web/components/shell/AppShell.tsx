'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  IconAnalytics,
  IconChevron,
  IconEmbed,
  IconMaps,
  IconOverview,
  IconProfile,
  IconSettings,
} from '@/components/shell/NavIcons';
import { GeoWaypointMark } from '@/components/shell/GeoWaypointMark';
import { Toaster } from '@/components/shell/Toaster';
import { NotificationBell } from '@/components/shell/NotificationBell';

const LS_KEY = 'gw_sb_collapsed';

type ResortRow = {
  id: string;
  name: string;
  plan: string;
  trial_ends_at: string | null;
};

type NavItem = {
  href: string;
  label: string;
  dataLabel: string;
  Icon: React.ComponentType<{ className?: string }>;
  count?: number;
};

const navMain: NavItem[] = [
  { href: '/overview', label: 'Overview', dataLabel: 'Overview', Icon: IconOverview },
  { href: '/maps', label: 'Maps', dataLabel: 'Maps', Icon: IconMaps },
  { href: '/analytics', label: 'Analytics', dataLabel: 'Analytics', Icon: IconAnalytics },
  { href: '/embed', label: 'Embed & API', dataLabel: 'Embed & API', Icon: IconEmbed },
];

const navAccount: NavItem[] = [
  { href: '/settings', label: 'Settings', dataLabel: 'Settings', Icon: IconSettings },
  { href: '/profile', label: 'My Profile', dataLabel: 'My Profile', Icon: IconProfile },
];

/** Staging-style subtitles under top bar title */
function topbarSubtitle(pathname: string): string | null {
  if (pathname === '/maps' || pathname.startsWith('/maps/')) {
    return 'Upload and manage your interactive site maps';
  }
  if (pathname === '/analytics') {
    return 'Guest interaction data across all maps';
  }
  if (pathname === '/embed') {
    return 'Add your interactive map to any webpage with one script tag';
  }
  if (pathname === '/settings') {
    return 'Configure your resort, subscription, and account';
  }
  if (pathname === '/profile') {
    return 'Your personal account details and preferences';
  }
  if (pathname.startsWith('/editor/')) {
    return 'Place sites, sync booking links, and publish';
  }
  return null;
}

function planLabel(plan: string | undefined): string {
  const p = (plan ?? 'starter').toLowerCase();
  if (p === 'trial') return 'Trial';
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function userInitials(email: string, displayName: string | undefined): string {
  const dn = displayName?.trim();
  if (dn) {
    const parts = dn.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return dn.slice(0, 2).toUpperCase();
  }
  const local = email.split('@')[0] ?? '?';
  const segs = local.split(/[._-]/).filter(Boolean);
  if (segs.length >= 2) {
    return (segs[0][0] + segs[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

function topbarLabel(pathname: string): string {
  if (pathname.startsWith('/editor')) return 'Map Editor';
  const all = [...navMain, ...navAccount];
  const hit = all.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  return hit?.label ?? 'GeoWaypoint';
}

type AppShellProps = {
  userEmail: string;
  userDisplayName?: string;
  resort: ResortRow | null;
  mapCount: number;
  siteCount: number;
  children: React.ReactNode;
};

export function AppShell({
  userEmail,
  userDisplayName,
  resort,
  mapCount,
  siteCount,
  children,
}: AppShellProps) {
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

  const initials = userInitials(userEmail, userDisplayName);
  const resortLetter = (resort?.name ?? 'R').charAt(0).toUpperCase();
  const subtitle = topbarSubtitle(pathname);

  function renderNavItem(item: NavItem) {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`nav-item${active ? ' active' : ''}`}
        data-label={item.dataLabel}
        onMouseEnter={(e) => showTooltip(e.currentTarget, item.label)}
        onMouseLeave={hideTooltip}
      >
        <item.Icon className="nav-icon" />
        <span className="nav-label">{item.label}</span>
        {item.count !== undefined ? <span className="nav-count">{item.count}</span> : null}
      </Link>
    );
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
              <div className="sidebar-brand-mark">
                <GeoWaypointMark size={18} />
              </div>
              <span className="sidebar-brand-text">GeoWaypoint</span>
            </div>
          </div>
          <div className="sidebar-resort">
            <div className="resort-pill sidebar-resort-detail">
              <span
                className="resort-av"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  background: 'var(--canopy)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-serif), Georgia, serif',
                  fontSize: 13,
                  color: '#fff',
                }}
              >
                {resortLetter}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                  {resort?.name ?? 'Resort'}
                </div>
                <div style={{ opacity: 0.45, fontSize: 10, fontWeight: 500, marginTop: 2 }}>
                  {planLabel(resort?.plan)} · {siteCount} site{siteCount === 1 ? '' : 's'}
                </div>
              </div>
              <span
                className="resort-caret sidebar-resort-detail"
                style={{
                  marginLeft: 'auto',
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: 10,
                  flexShrink: 0,
                }}
                title="Resort switching coming soon"
                aria-hidden
              >
                ▾
              </span>
            </div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section-label">Main</div>
            {navMain.map((item) =>
              renderNavItem(item.href === '/maps' ? { ...item, count: mapCount } : { ...item })
            )}
            <div className="nav-section-label" style={{ marginTop: 10 }}>
              Account
            </div>
            {navAccount.map((item) => renderNavItem(item))}
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
            <div className="sidebar-bottom-detail sidebar-user-row">
              <div className="sidebar-user-av">{initials}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="sidebar-user-nm">
                  {userDisplayName?.trim() || userEmail.split('@')[0] || 'User'}
                </div>
                <div className="sidebar-user-em">{userEmail}</div>
              </div>
              <button
                type="button"
                className="sidebar-logout-btn"
                title="Sign out"
                aria-label="Sign out"
                onClick={() => void signOut()}
              >
                ↩
              </button>
            </div>
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
            <div style={{ flex: 1, minWidth: 0, marginRight: 'auto' }}>
              <h1 className="topbar-title">{topbarLabel(pathname)}</h1>
              {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
            </div>
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
