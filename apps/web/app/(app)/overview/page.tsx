import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GuestPreviewLauncher } from '@/components/preview/GuestMapPreviewModal';

function greetingHour(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function relativeUpdated(d: Date): string {
  const ms = Date.now() - d.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function GradientMapThumb() {
  return (
    <div className="map-thumb-mini map-thumb-gradient" style={{ flexShrink: 0 }} aria-hidden>
      <svg viewBox="0 0 48 36" preserveAspectRatio="none">
        <path
          d="M4 28 L12 12 L20 20 L32 8 L44 24"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function eventLabel(event: string): { title: string; bg: string } {
  switch (event) {
    case 'book_click':
      return { title: 'Book request', bg: 'var(--morning)' };
    case 'marker_click':
    case 'site_click':
      return { title: 'Site viewed on map', bg: '#EEF4FF' };
    case 'map_view':
      return { title: 'Map opened', bg: 'var(--fog)' };
    default:
      return { title: event.replace(/_/g, ' '), bg: 'var(--fog)' };
  }
}

export default async function OverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const meta = user.user_metadata as { full_name?: string } | undefined;
  const firstName = meta?.full_name?.split(/\s+/)[0] ?? user.email?.split('@')[0] ?? 'there';

  const { data: resort } = await supabase
    .from('resorts')
    .select('id, name, plan, slug')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!resort) {
    return (
      <div>
        <p style={{ color: 'var(--ink3)' }}>No resort found. Complete onboarding first.</p>
      </div>
    );
  }

  const { data: maps } = await supabase
    .from('maps')
    .select('id, name, image_url, is_published, created_at')
    .eq('resort_id', resort.id)
    .order('created_at', { ascending: false });

  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, status, map_id')
    .eq('resort_id', resort.id);

  const siteByMap = new Map<string, number>();
  const siteNameById = new Map<string, string>();
  for (const s of sites ?? []) {
    if (s.map_id) {
      siteByMap.set(s.map_id, (siteByMap.get(s.map_id) ?? 0) + 1);
    }
    siteNameById.set(s.id, s.name);
  }

  const statuses = (sites ?? []).map((s) => ({ status: s.status }));
  const total = statuses.length;
  const available = statuses.filter((s) => (s.status ?? 'available').toLowerCase() === 'available').length;
  const occupied = statuses.filter((s) => (s.status ?? '').toLowerCase() === 'occupied').length;

  const now = Date.now();
  const sevenMs = 7 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = new Date(now - sevenMs).toISOString();
  const fourteenDaysAgo = new Date(now - 2 * sevenMs).toISOString();

  const { count: bookClicks7d } = await supabase
    .from('embed_events')
    .select('id', { count: 'exact', head: true })
    .eq('resort_id', resort.id)
    .eq('event', 'book_click')
    .gte('created_at', sevenDaysAgo);

  const { count: bookClicksPrev7d } = await supabase
    .from('embed_events')
    .select('id', { count: 'exact', head: true })
    .eq('resort_id', resort.id)
    .eq('event', 'book_click')
    .gte('created_at', fourteenDaysAgo)
    .lt('created_at', sevenDaysAgo);

  const curr = bookClicks7d ?? 0;
  const prev = bookClicksPrev7d ?? 0;
  let bookTrend: string | null = null;
  if (prev > 0) {
    const pct = Math.round(((curr - prev) / prev) * 100);
    bookTrend = `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct)}% vs prior week`;
  } else if (curr > 0) {
    bookTrend = 'New this week';
  }

  const { data: recentEvents } = await supabase
    .from('embed_events')
    .select('id, event, created_at, site_id, map_id')
    .eq('resort_id', resort.id)
    .order('created_at', { ascending: false })
    .limit(12);

  const mapList = maps ?? [];
  const lastTouch = mapList.length
    ? new Date(Math.max(...mapList.map((m) => new Date(m.created_at ?? 0).getTime())))
    : null;
  const liveCount = mapList.filter((m) => m.is_published).length;
  const firstPublished = mapList.find((m) => m.is_published);

  const heroSub =
    liveCount > 0
      ? `Your map${liveCount > 1 ? 's are' : ' is'} live · Last updated ${lastTouch ? relativeUpdated(lastTouch) : '—'}`
      : `No published maps yet · ${resort.plan === 'trial' ? 'Trial' : resort.plan.charAt(0).toUpperCase() + resort.plan.slice(1)} plan`;

  return (
    <div>
      <div className="overview-hero">
        <div className="hero-label" style={{ position: 'relative', zIndex: 1 }}>
          {greetingHour()}, {firstName}
        </div>
        <h2 className="hero-title" style={{ position: 'relative', zIndex: 2 }}>
          {resort.name}
        </h2>
        <p className="hero-sub" style={{ position: 'relative', zIndex: 1 }}>
          {heroSub}
        </p>
        <div className="hero-actions" style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/maps" className="btn-hero btn-hero-primary">
            Open Map Editor
          </Link>
          <GuestPreviewLauncher
            resortSlug={resort.slug}
            mapId={firstPublished?.id ?? null}
            resortName={resort.name}
            label="Preview Guest View"
          />
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-c">
          <div className="stat-lbl">
            <span className="stat-dot" style={{ background: 'var(--canopy)' }} />
            Available
          </div>
          <div className="stat-num">{available}</div>
          <div className="stat-sub">of {total} total sites</div>
        </div>
        <div className="stat-c">
          <div className="stat-lbl">
            <span className="stat-dot" style={{ background: 'var(--sky)' }} />
            Booking clicks
          </div>
          <div className="stat-num">{curr}</div>
          <div className={`stat-sub${bookTrend ? ' stat-up' : ''}`}>
            {bookTrend ?? 'last 7 days'}
          </div>
        </div>
        <div className="stat-c">
          <div className="stat-lbl">
            <span className="stat-dot" style={{ background: 'var(--amber)' }} />
            Occupied
          </div>
          <div className="stat-num">{occupied}</div>
          <div className="stat-sub">guests on-site</div>
        </div>
        <div className="stat-c">
          <div className="stat-lbl">
            <span className="stat-dot" style={{ background: 'var(--canopy)' }} />
            Webhook health
          </div>
          <div className="stat-num">—</div>
          <div className="stat-sub">Connect OwnerRez in Settings</div>
        </div>
      </div>

      <div className="two-col">
        <div className="gw-dash-card">
          <div className="card-head">
            <span className="card-title">Your maps</span>
            <Link href="/maps" className="btn btn-primary btn-sm" style={{ padding: '7px 13px', fontSize: 12 }}>
              + New map
            </Link>
          </div>
          <div className="card-body gw-map-rows-body">
            {mapList.length === 0 ? (
              <p>No maps yet. Create one from the Maps page.</p>
            ) : (
              mapList.map((m) => {
                const nSites = siteByMap.get(m.id) ?? 0;
                return (
                  <Link key={m.id} href={`/editor/${m.id}`} className="map-row-mini">
                    {m.image_url ? (
                      <Image
                        src={m.image_url}
                        alt=""
                        width={48}
                        height={36}
                        className="map-thumb-mini"
                        unoptimized
                      />
                    ) : (
                      <GradientMapThumb />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div className="map-row-name">{m.name}</div>
                      <div className="map-row-meta">
                        {nSites} site{nSites === 1 ? '' : 's'} · Edited{' '}
                        {m.created_at ? relativeUpdated(new Date(m.created_at)) : '—'}
                      </div>
                    </div>
                    <div className="map-row-right">
                      <span className={`pill ${m.is_published ? 'pill-green' : 'pill-amber'}`}>
                        {m.is_published ? 'Live' : 'Draft'}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="gw-dash-card">
          <div className="card-head">
            <span className="card-title">Booking events</span>
            <span className="pill pill-green" style={{ fontSize: 10 }}>
              Live
            </span>
          </div>
          <div className="card-body">
            {(recentEvents ?? []).length === 0 ? (
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink3)' }}>
                No guest activity yet. Publish a map and embed it on your site to see bookings and views here.
              </p>
            ) : (
              (recentEvents ?? []).map((ev) => {
                const { title, bg } = eventLabel(ev.event);
                const siteNm = ev.site_id ? siteNameById.get(ev.site_id) : null;
                return (
                  <div key={ev.id} className="gw-event-row">
                    <div className="gw-event-icon" style={{ background: bg, color: 'var(--ink2)' }}>
                      {ev.event === 'book_click' ? '●' : '◆'}
                    </div>
                    <div className="gw-event-body">
                      <div className="gw-event-title">{title}</div>
                      <div className="gw-event-meta">
                        {relativeUpdated(new Date(ev.created_at))}
                        {ev.event === 'book_click' ? ' · guest interaction' : ''}
                      </div>
                    </div>
                    {siteNm ? <div className="gw-event-site">{siteNm}</div> : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
