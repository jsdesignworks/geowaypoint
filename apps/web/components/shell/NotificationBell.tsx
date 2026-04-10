'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Item = { id: string; title: string; body: string; read: boolean };

const MOCK: Item[] = [
  { id: '1', title: 'Welcome', body: 'GeoWaypoint notifications will appear here (spec §17).', read: false },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>(MOCK);
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((i) => !i.read).length;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-outline"
        style={{ padding: '6px 10px', position: 'relative' }}
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
      >
        🔔
        {unread > 0 ? (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: 'var(--rust)',
              color: '#fff',
              fontSize: 10,
              lineHeight: '16px',
              textAlign: 'center',
              padding: '0 4px',
            }}
          >
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          className="card"
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 8,
            width: 320,
            maxHeight: 360,
            overflow: 'auto',
            zIndex: 3000,
            boxShadow: '0 12px 40px var(--shadow2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Notifications</span>
            <button type="button" className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 11 }} onClick={markAllRead}>
              Mark read
            </button>
          </div>
          {items.map((i) => (
            <div
              key={i.id}
              style={{
                padding: '10px 0',
                borderTop: '1px solid var(--border)',
                opacity: i.read ? 0.65 : 1,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{i.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 4 }}>{i.body}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
