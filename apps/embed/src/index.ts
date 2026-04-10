/**
 * GeoWaypoint guest embed — framework-free, single bundle (spec §9–10).
 * Host: `<div id="gw-map" data-resort="slug" data-map-id="uuid" data-api-base="https://app..."></div>`
 * `<script src=".../embed.min.js" defer></script>`
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
    apiBase = sc?.src ? new URL(sc.src, location.href).origin : location.origin;
  }

  const COLORS = ['#2d6a4f', '#1b6b93', '#bc6c25', '#6c4ab6', '#c1121f', '#0077b6', '#fb8500'];

  function pct(n: unknown, fb: number) {
    const x = typeof n === 'number' ? n : parseFloat(String(n));
    if (!Number.isFinite(x)) {
      return fb;
    }
    return Math.min(100, Math.max(0, x));
  }

  function postEvent(event: string, siteId?: string) {
    void fetch(`${apiBase}/api/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, mapId, event, siteId: siteId ?? null }),
    }).catch(() => {});
  }

  root.style.position = 'relative';
  root.style.minHeight = root.style.minHeight || '420px';
  root.innerHTML = '<div class="gw-inner" style="position:relative;width:100%;min-height:inherit;"></div>';
  const inner = root.querySelector('.gw-inner') as HTMLDivElement;

  void (async () => {
    try {
      const r = await fetch(`${apiBase}/api/embed/${encodeURIComponent(slug)}/${encodeURIComponent(mapId)}`);
      if (!r.ok) {
        inner.textContent = 'Map could not be loaded.';
        return;
      }
      const data = (await r.json()) as {
        map: { image_url: string | null; name: string };
        sites: Array<{
          id: string;
          name: string;
          rate_night?: number | null;
          description?: string | null;
          pos_x?: number | string | null;
          pos_y?: number | string | null;
        }>;
      };
      postEvent('map_view');

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

      data.sites.forEach((s, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', s.name);
        dot.style.cssText = `position:absolute;width:14px;height:14px;border-radius:50%;transform:translate(-50%,-50%);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.2);cursor:pointer;padding:0;left:${pct(s.pos_x, 50)}%;top:${pct(s.pos_y, 50)}%;background:${COLORS[i % COLORS.length]};`;
        dot.addEventListener('click', (ev) => {
          ev.stopPropagation();
          postEvent('site_click', s.id);
          const rate =
            s.rate_night != null && s.rate_night !== ''
              ? `<div style="font-weight:600;margin-top:6px">$${Number(s.rate_night)}/night</div>`
              : '';
          const desc = s.description ? `<p style="margin:8px 0 0;font-size:13px;color:#444">${escapeHtml(s.description)}</p>` : '';
          popup.innerHTML = `<div style="font-weight:700">${escapeHtml(s.name)}</div>${rate}${desc}<button type="button" class="gw-book" style="margin-top:10px;padding:8px 14px;border:none;border-radius:6px;background:#2d6a4f;color:#fff;font-weight:600;cursor:pointer;width:100%">Book</button>`;
          const br = dot.getBoundingClientRect();
          const sr = stage.getBoundingClientRect();
          popup.style.left = `${br.left - sr.left + 16}px`;
          popup.style.top = `${br.top - sr.top + 16}px`;
          popup.style.display = 'block';
          const book = popup.querySelector('.gw-book');
          book?.addEventListener('click', () => {
            postEvent('book_click', s.id);
            void fetch(`${apiBase}/api/quotes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ slug, mapId, siteId: s.id }),
            })
              .then((q) => q.json())
              .then((j: { paymentUrl?: string | null }) => {
                if (j.paymentUrl) {
                  window.open(j.paymentUrl, '_blank', 'noopener');
                }
              })
              .catch(() => {});
          });
        });
        stage.appendChild(dot);
      });

      stage.addEventListener('click', () => {
        popup.style.display = 'none';
      });
    } catch {
      inner.textContent = 'Map could not be loaded.';
    }
  })();
})();

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
