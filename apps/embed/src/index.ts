/**
 * GeoWaypoint guest embed — framework-free (spec §9–10).
 * `<div id="gw-map" data-resort="slug" data-map-id="uuid" data-api-base="https://app..."></div>`
 */
(function geoWaypointEmbed() {
  const root = document.getElementById('gw-map');
  if (!root) {
    return;
  }
  root.setAttribute('data-gw-embed', '1');
  const slug = root.getAttribute('data-resort') || root.getAttribute('data-slug');
  const mapId = root.getAttribute('data-map-id');
  if (!slug || !mapId) {
    root.textContent = 'GeoWaypoint: set data-resort and data-map-id on #gw-map';
    return;
  }

  let apiBase = root.getAttribute('data-api-base');
  if (!apiBase) {
    const sc = document.querySelector('script[src*="embed.min.js"]') as HTMLScriptElement | null;
    apiBase = sc?.src ? new URL(sc.src, location.href).origin : location.href;
  }
  apiBase = apiBase.replace(/\/$/, '');

  function readAttrOn(el: HTMLElement, name: string, defaultOn = true) {
    const v = el.getAttribute(name);
    if (v === null || v === '') {
      return defaultOn;
    }
    const s = v.trim().toLowerCase();
    if (s === '0' || s === 'false' || s === 'no' || s === 'off') {
      return false;
    }
    return true;
  }

  const showHeader = readAttrOn(root, 'data-show-header');
  const showFilters = readAttrOn(root, 'data-show-filters');
  const showCompare = readAttrOn(root, 'data-show-compare');
  const showFooter = readAttrOn(root, 'data-show-footer');
  const showBook = readAttrOn(root, 'data-show-book');

  const STATUS_CLASS: Record<string, string> = {
    available: 'wm-avail',
    occupied: 'wm-occ',
    reserved: 'wm-res',
    maintenance: 'wm-maint',
  };
  const STATUS_COLOR: Record<string, string> = {
    available: '#2D6B42',
    occupied: '#8B2D2D',
    reserved: '#7A4818',
    maintenance: '#5A5A58',
  };

  const MAX_COMPARE = 4;

  function pct(n: unknown, fb: number) {
    const x = typeof n === 'number' ? n : parseFloat(String(n));
    if (!Number.isFinite(x)) {
      return fb;
    }
    return Math.min(100, Math.max(0, x));
  }

  function siteMarkerLabel(s: { display_code?: string | null; name: string }, index: number) {
    const dc = s.display_code && String(s.display_code).trim();
    if (dc) {
      return dc.slice(0, 6).toUpperCase();
    }
    const name = (s.name || '').trim();
    const m = name.match(/^([A-Za-z]{1,3}\d{1,3})\b/);
    if (m) {
      return m[1].toUpperCase();
    }
    if (name.length > 0 && name.length <= 5) {
      return name.toUpperCase();
    }
    const row = String.fromCharCode(65 + (index % 26));
    return `${row}${Math.floor(index / 26) + 1}`;
  }

  function amenityTags(description: string | null | undefined): string[] {
    const d = (description ?? '').trim();
    if (!d || d.indexOf(',') < 0) {
      return [];
    }
    return d
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length <= 48)
      .slice(0, 12);
  }

  const sessionStorageKey = `gw_embed_sess_v1:${slug}:${mapId}`;
  const sessionSeqKey = `${sessionStorageKey}:seq`;

  function embedSessionId(): string {
    try {
      const existing = sessionStorage.getItem(sessionStorageKey);
      if (existing && existing.length >= 8 && existing.length <= 80) {
        return existing;
      }
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `gw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
      sessionStorage.setItem(sessionStorageKey, id);
      return id;
    } catch {
      return `gw_${Date.now()}`;
    }
  }

  function nextClientSeq(): number {
    try {
      const raw = sessionStorage.getItem(sessionSeqKey);
      const n = raw ? parseInt(raw, 10) : 0;
      const next = Number.isFinite(n) ? n + 1 : 1;
      sessionStorage.setItem(sessionSeqKey, String(next));
      return next;
    } catch {
      return Date.now() % 1_000_000_000;
    }
  }

  function postEvent(event: string, siteId?: string) {
    const session_id = embedSessionId();
    const client_seq = nextClientSeq();
    void fetch(`${apiBase}/api/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        resort_slug: slug,
        map_id: mapId,
        site_id: siteId ?? null,
        session_id,
        client_seq,
      }),
    }).catch(() => {});
  }

  function defaultStayDates() {
    const a = new Date();
    const d = new Date(a);
    d.setDate(d.getDate() + 7);
    return { Arrival: a.toISOString().slice(0, 10), Departure: d.toISOString().slice(0, 10) };
  }

  function clampPopup(popup: HTMLElement, stage: HTMLElement) {
    const margin = 12;
    const pr = popup.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    let left = parseFloat(popup.style.left) || 0;
    let top = parseFloat(popup.style.top) || 0;
    if (left + pr.width > sr.width - margin) {
      left = Math.max(margin, sr.width - pr.width - margin);
    }
    if (top + pr.height > sr.height - margin) {
      top = Math.max(margin, sr.height - pr.height - margin);
    }
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  }

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  root.style.position = 'relative';
  root.style.minHeight = root.style.minHeight || '420px';
  root.style.display = 'flex';
  root.style.flexDirection = 'column';
  root.innerHTML = '';

  const header = document.createElement('div');
  header.style.cssText =
    'padding:10px 12px;background:#1A4A2A;color:#fff;font:13px system-ui,sans-serif;border-radius:8px 8px 0 0;';
  const headerInner = document.createElement('div');
  headerInner.style.cssText =
    'display:flex;flex-wrap:wrap;align-items:center;gap:12px;width:100%;justify-content:space-between;';

  const resortTitle = document.createElement('h2');
  resortTitle.style.cssText =
    'margin:0;font-size:1.05rem;font-weight:600;color:#fff;flex:1 1 140px;min-width:0;line-height:1.25;font-family:Georgia,Times New Roman,serif;';
  resortTitle.textContent = '';
  headerInner.appendChild(resortTitle);

  const controls = document.createElement('div');
  controls.style.cssText =
    'display:flex;flex-wrap:wrap;align-items:center;gap:8px;flex:2 1 280px;justify-content:flex-end;';

  const filters: Record<string, boolean> = {};
  const filterKeys = ['available', 'occupied', 'reserved', 'maintenance'] as const;
  const filterBtns: HTMLButtonElement[] = [];
  filterKeys.forEach((st) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText =
      'border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;padding:6px 10px;border-radius:6px;cursor:pointer;font:inherit;display:flex;align-items:center;gap:6px;';
    const dot = document.createElement('span');
    dot.style.cssText = `width:8px;height:8px;border-radius:50%;background:${STATUS_COLOR[st]};`;
    btn.appendChild(dot);
    btn.appendChild(document.createTextNode(st.charAt(0).toUpperCase() + st.slice(1)));
    btn.addEventListener('click', () => {
      filters[st] = !filters[st];
      btn.style.background = filters[st] ? '#fff' : 'transparent';
      btn.style.color = filters[st] ? '#1A4A2A' : '#fff';
      applyFilters();
      updateClear();
    });
    filterBtns.push(btn);
    controls.appendChild(btn);
  });

  let compareMode = false;
  const compareBtn = document.createElement('button');
  compareBtn.type = 'button';
  compareBtn.textContent = 'Compare';
  compareBtn.setAttribute('aria-pressed', 'false');
  compareBtn.style.cssText =
    'border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;padding:6px 10px;border-radius:6px;cursor:pointer;font:inherit;';
  compareBtn.addEventListener('click', () => {
    compareMode = !compareMode;
    compareBtn.style.background = compareMode ? '#fff' : 'transparent';
    compareBtn.style.color = compareMode ? '#1A4A2A' : '#fff';
    compareBtn.setAttribute('aria-pressed', compareMode ? 'true' : 'false');
    if (!compareMode) {
      compareIds = [];
      updateCompareUi();
    }
  });
  controls.appendChild(compareBtn);

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.textContent = '✕ Clear';
  clearBtn.style.cssText =
    'display:none;border:none;background:rgba(255,255,255,.2);color:#fff;padding:6px 10px;border-radius:6px;cursor:pointer;font:inherit;';
  clearBtn.addEventListener('click', () => {
    filterKeys.forEach((st) => {
      filters[st] = false;
    });
    filterBtns.forEach((b) => {
      b.style.background = 'transparent';
      b.style.color = '#fff';
    });
    applyFilters();
    updateClear();
  });
  controls.appendChild(clearBtn);

  if (!showFilters) {
    filterBtns.forEach((b) => {
      b.style.display = 'none';
    });
    clearBtn.style.display = 'none';
  }
  if (!showCompare) {
    compareBtn.style.display = 'none';
  }

  headerInner.appendChild(controls);
  header.appendChild(headerInner);
  if (!showHeader) {
    header.style.display = 'none';
  }

  function anyFilter() {
    return filterKeys.some((st) => filters[st]);
  }
  function updateClear() {
    clearBtn.style.display = anyFilter() ? 'block' : 'none';
  }

  const shell = document.createElement('div');
  shell.style.cssText =
    'display:flex;flex-direction:column;flex:1;min-height:0;border:1px solid #d0e4d8;border-top:none;border-radius:0 0 8px 8px;background:#f0f7f3;';

  const mainRow = document.createElement('div');
  mainRow.style.cssText = 'display:flex;flex:1;min-height:0;align-items:stretch;';

  const mainCol = document.createElement('div');
  mainCol.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;';

  const inner = document.createElement('div');
  inner.className = 'gw-inner';
  inner.style.cssText = 'position:relative;width:100%;flex:1;min-height:280px;padding:12px;overflow:auto;';

  const footer = document.createElement('div');
  footer.style.cssText =
    'display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f0f7f3;border-top:1px solid #d0e4d8;font:12px system-ui,sans-serif;color:#4a5e4a;flex-shrink:0;';

  const sidebar = document.createElement('aside');
  sidebar.style.cssText =
    'display:none;width:300px;flex-shrink:0;border-left:1px solid #d0e4d8;background:#fff;overflow:auto;padding:12px;font:13px system-ui,sans-serif;';

  mainCol.appendChild(inner);
  mainCol.appendChild(footer);
  mainRow.appendChild(mainCol);
  mainRow.appendChild(sidebar);

  const compareBar = document.createElement('div');
  compareBar.style.cssText =
    'display:none;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:#1A4A2A;color:#fff;font:13px system-ui,sans-serif;flex-shrink:0;';
  const compareCountEl = document.createElement('span');
  const compareClearBtn = document.createElement('button');
  compareClearBtn.type = 'button';
  compareClearBtn.textContent = 'Clear';
  compareClearBtn.style.cssText =
    'padding:6px 12px;border:1px solid rgba(255,255,255,.5);background:transparent;color:#fff;border-radius:6px;cursor:pointer';
  const compareGoBtn = document.createElement('button');
  compareGoBtn.type = 'button';
  compareGoBtn.textContent = 'Compare';
  compareGoBtn.style.cssText =
    'padding:6px 12px;border:none;background:#fff;color:#1A4A2A;border-radius:6px;cursor:pointer;font-weight:600';
  const compareBtnWrap = document.createElement('div');
  compareBtnWrap.style.display = 'flex';
  compareBtnWrap.style.gap = '8px';
  compareBtnWrap.appendChild(compareClearBtn);
  compareBtnWrap.appendChild(compareGoBtn);
  compareBar.appendChild(compareCountEl);
  compareBar.appendChild(compareBtnWrap);

  const comparePanel = document.createElement('div');
  comparePanel.id = 'gw-embed-compare-panel';
  comparePanel.setAttribute('role', 'region');
  comparePanel.setAttribute('aria-label', 'Side by side comparison');
  comparePanel.style.cssText =
    'display:none;padding:12px;background:#fafdf8;border-top:1px solid #d0e4d8;max-height:240px;overflow:auto;font:13px system-ui,sans-serif;';
  let comparePanelOpen = false;
  compareGoBtn.id = 'gw-embed-compare-toggle';
  compareGoBtn.setAttribute('aria-controls', 'gw-embed-compare-panel');
  compareGoBtn.setAttribute('aria-expanded', 'false');

  shell.appendChild(mainRow);
  shell.appendChild(compareBar);
  shell.appendChild(comparePanel);
  root.appendChild(header);
  root.appendChild(shell);

  let markers: HTMLElement[] = [];
  let sitesData: Array<{
    id: string;
    name: string;
    display_code?: string | null;
    status?: string | null;
    site_type?: string | null;
    rate_night?: number | null;
    max_length_ft?: number | null;
    description?: string | null;
    pos_x?: number | string | null;
    pos_y?: number | string | null;
    ownerrez_property_id?: string | null;
  }> = [];
  let compareIds: string[] = [];
  let detailMode: 'popup' | 'sidebar' = 'popup';
  let allSites: typeof sitesData = [];

  function applyFilters() {
    const active = anyFilter();
    markers.forEach((el, i) => {
      const st = (sitesData[i]?.status ?? 'available').toLowerCase();
      if (!active) {
        el.style.display = '';
        return;
      }
      const on = filters[st] === true;
      el.style.display = on ? '' : 'none';
    });
  }

  function syncCompareMarkers() {
    markers.forEach((mEl, mi) => {
      const id = sitesData[mi]?.id;
      if (id && compareIds.includes(id)) {
        mEl.style.boxShadow = '0 0 0 3px #fff, 0 0 0 5px #3a7ca8';
      } else {
        mEl.style.boxShadow = '';
      }
    });
  }

  function updateCompareUi() {
    if (!showCompare) {
      compareBar.style.display = 'none';
      comparePanel.style.display = 'none';
      comparePanel.innerHTML = '';
      comparePanelOpen = false;
      compareGoBtn.setAttribute('aria-expanded', 'false');
      return;
    }
    const n = compareIds.length;
    compareCountEl.textContent = `${n} site${n === 1 ? '' : 's'} selected`;
    if (n === 0) {
      compareBar.style.display = 'none';
      comparePanel.style.display = 'none';
      comparePanel.innerHTML = '';
      comparePanelOpen = false;
      compareGoBtn.setAttribute('aria-expanded', 'false');
      return;
    }
    compareBar.style.display = 'flex';
  }

  function closeComparePanel() {
    comparePanelOpen = false;
    comparePanel.style.display = 'none';
    comparePanel.innerHTML = '';
    compareGoBtn.textContent = 'Compare';
    compareGoBtn.setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && comparePanelOpen) {
      e.preventDefault();
      closeComparePanel();
    }
  });

  compareClearBtn.addEventListener('click', () => {
    compareIds = [];
    closeComparePanel();
    syncCompareMarkers();
    updateCompareUi();
  });

  compareGoBtn.addEventListener('click', () => {
    if (compareIds.length === 0) {
      return;
    }
    if (comparePanelOpen) {
      closeComparePanel();
      return;
    }
    comparePanelOpen = true;
    compareGoBtn.textContent = 'Hide compare';
    compareGoBtn.setAttribute('aria-expanded', 'true');
    const rows = compareIds
      .map((id) => allSites.find((s) => s.id === id))
      .filter((x): x is (typeof allSites)[0] => x != null);
    comparePanel.style.display = 'block';
    comparePanel.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">${rows
      .map((s) => {
        const si = allSites.findIndex((x) => x.id === s.id);
        const tags = amenityTags(s.description);
        const tagHtml =
          tags.length > 0
            ? `<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">${tags
                .map((t) => `<span style="padding:2px 6px;background:#e4f3ec;border-radius:999px;font-size:10px">${escapeHtml(t)}</span>`)
                .join('')}</div>`
            : '';
        return `<div style="border:1px solid #d0e4d8;border-radius:8px;padding:10px;background:#fff"><strong>${escapeHtml(siteMarkerLabel(s, si >= 0 ? si : 0))}</strong><div style="font-size:12px;color:#666;margin:4px 0">${escapeHtml(s.name)}</div>${s.rate_night != null ? `<div>$${Number(s.rate_night)}/night</div>` : ''}${tagHtml}</div>`;
      })
      .join('')}</div>`;
  });

  function updateFooter() {
    if (!showFooter) {
      footer.style.display = 'none';
      return;
    }
    footer.style.display = 'flex';
    const total = allSites.length;
    const avail = allSites.filter((s) => (s.status ?? 'available').toLowerCase() === 'available').length;
    footer.innerHTML = `<span>${avail} of ${total} sites available</span><span style="font-size:10px">Powered by GeoWaypoint</span>`;
  }

  function buildDetailInner(s: (typeof sitesData)[0], siteIndex: number) {
    const st = (s.status ?? 'available').toLowerCase();
    const tags = amenityTags(s.description);
    const prose =
      s.description && tags.length === 0 ? `<p style="margin:8px 0 0;font-size:12px;color:#444">${escapeHtml(s.description)}</p>` : '';
    const tagHtml =
      tags.length > 0
        ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">${tags
            .map((t) => `<span style="padding:3px 8px;background:#e4f3ec;border-radius:999px;font-size:10px;font-weight:600;color:#1A4A2A">${escapeHtml(t)}</span>`)
            .join('')}</div>`
        : '';
    const typeRow = s.site_type
      ? `<div style="display:flex;justify-content:space-between;font-size:13px;margin:6px 0"><span style="color:#888">Type</span><span>${escapeHtml(s.site_type)}</span></div>`
      : '';
    const lenRow =
      s.max_length_ft != null
        ? `<div style="display:flex;justify-content:space-between;font-size:13px;margin:6px 0"><span style="color:#888">Max length</span><span>${Number(s.max_length_ft)} ft</span></div>`
        : '';
    const rateRow =
      s.rate_night != null
        ? `<div style="display:flex;justify-content:space-between;font-size:13px;margin:6px 0"><span style="color:#888">Nightly rate</span><span>$${Number(s.rate_night)} / night</span></div>`
        : '';
    const bookBtn = showBook
      ? `<button type="button" class="gw-book" style="margin-top:10px;padding:9px 14px;border:none;border-radius:6px;background:#2D6B42;color:#fff;font-weight:700;cursor:pointer;width:100%">Book this site</button>`
      : '';
    return `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px"><div><div style="font-weight:700;font-size:15px">${escapeHtml(siteMarkerLabel(s, siteIndex))}</div><div style="font-size:13px;color:#444;margin-top:2px">${escapeHtml(s.name)}</div></div><button type="button" class="gw-pop-x" style="border:none;background:transparent;color:#888;font-size:18px;cursor:pointer;line-height:1">×</button></div><div style="display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;padding:4px 8px;border-radius:6px;margin-bottom:8px;background:#e4f3ec;color:#2d6b42">${escapeHtml(st)}</div>${typeRow}${lenRow}${rateRow}${tagHtml}${prose}${bookBtn}`;
  }

  function wireBook(rootEl: HTMLElement, s: (typeof sitesData)[0]) {
    if (!showBook) {
      return;
    }
    const book = rootEl.querySelector('.gw-book');
    book?.addEventListener('click', () => {
      postEvent('book_click', s.id);
      const dates = defaultStayDates();
      void fetch(`${apiBase}/api/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resort_slug: slug,
          map_id: mapId,
          site_id: s.id,
          PropertyId: s.ownerrez_property_id,
          Arrival: dates.Arrival,
          Departure: dates.Departure,
          Adults: 2,
          Children: 0,
          Pets: 0,
        }),
      })
        .then((q) => q.json())
        .then((j: { paymentUrl?: string | null }) => {
          if (j.paymentUrl) {
            window.location.href = j.paymentUrl;
          } else {
            window.alert((j as { message?: string }).message ?? 'Booking is not available yet.');
          }
        })
        .catch(() => {});
    });
  }

  void (async () => {
    try {
      const r = await fetch(`${apiBase}/api/embed/${encodeURIComponent(slug)}/${encodeURIComponent(mapId)}`);
      if (!r.ok) {
        inner.textContent = 'Map could not be loaded.';
        return;
      }
      const data = (await r.json()) as {
        resort?: { name?: string; slug?: string };
        map: {
          image_url: string | null;
          name: string;
          guest_site_detail_mode?: string | null;
        };
        sites: typeof sitesData;
      };
      resortTitle.textContent = (data.resort && data.resort.name) || data.map.name || '';
      postEvent('map_view');
      allSites = data.sites;
      sitesData = data.sites;
      detailMode = data.map.guest_site_detail_mode === 'sidebar' ? 'sidebar' : 'popup';
      updateFooter();

      const stage = document.createElement('div');
      stage.style.cssText = 'position:relative;display:inline-block;max-width:100%;';
      inner.appendChild(stage);

      if (data.map.image_url) {
        const img = document.createElement('img');
        img.src = data.map.image_url;
        img.alt = data.map.name || '';
        img.style.cssText = 'display:block;max-width:100%;height:auto;';
        stage.appendChild(img);
      }

      const popup = document.createElement('div');
      popup.style.cssText =
        'display:none;position:absolute;z-index:20;min-width:200px;max-width:280px;padding:12px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.12);font:14px system-ui,sans-serif;';
      stage.appendChild(popup);

      markers = [];
      data.sites.forEach((s, siteIndex) => {
        const st = (s.status ?? 'available').toLowerCase();
        const bg = STATUS_COLOR[st] ?? STATUS_COLOR.available;
        const dot = document.createElement('button');
        dot.type = 'button';
        const code = siteMarkerLabel(s, siteIndex);
        dot.setAttribute('aria-label', `${code} ${s.name}`);
        dot.style.cssText = `position:absolute;min-width:28px;height:28px;padding:0 5px;border-radius:999px;transform:translate(-50%,-50%);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.2);cursor:pointer;display:flex;align-items:center;justify-content:center;left:${pct(s.pos_x, 50)}%;top:${pct(s.pos_y, 50)}%;background:${bg};font-size:10px;font-weight:800;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35);`;
        const lab = document.createElement('span');
        lab.textContent = code;
        dot.appendChild(lab);
        dot.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const e = ev as MouseEvent;
          if (showCompare && (compareMode || e.shiftKey)) {
            let next = compareIds.filter((id) => id !== s.id);
            if (next.length === compareIds.length) {
              if (compareIds.length >= MAX_COMPARE) {
                return;
              }
              next = [...compareIds, s.id];
            }
            compareIds = next;
            syncCompareMarkers();
            updateCompareUi();
            popup.style.display = 'none';
            sidebar.style.display = 'none';
            return;
          }
          postEvent('marker_click', s.id);
          const html = buildDetailInner(s, siteIndex);
          if (detailMode === 'sidebar') {
            popup.style.display = 'none';
            sidebar.style.display = 'block';
            sidebar.innerHTML = html;
            sidebar.querySelector('.gw-pop-x')?.addEventListener('click', () => {
              sidebar.style.display = 'none';
            });
            wireBook(sidebar, s);
            return;
          }
          popup.innerHTML = html;
          popup.querySelector('.gw-pop-x')?.addEventListener('click', () => {
            popup.style.display = 'none';
          });
          wireBook(popup, s);
          const br = dot.getBoundingClientRect();
          const sr = stage.getBoundingClientRect();
          popup.style.left = `${br.left - sr.left + 16}px`;
          popup.style.top = `${br.top - sr.top + 16}px`;
          popup.style.display = 'block';
          requestAnimationFrame(() => clampPopup(popup, stage));
        });
        stage.appendChild(dot);
        markers.push(dot);
      });

      applyFilters();
      stage.addEventListener('click', () => {
        popup.style.display = 'none';
      });
    } catch {
      inner.textContent = 'Map could not be loaded.';
    }
  })();
})();
