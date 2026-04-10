'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Item = { id: string; title: string; body: string | null; read: boolean };

/** Spec §17 — bell + panel (loads from `notifications` when migration applied). */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return;
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, body, read_at')
      .order('created_at', { ascending: false })
      .limit(40);
    if (error || !data) {
      setItems([
        {
          id: 'welcome',
          title: 'Notifications',
          body: 'Apply the latest database migration to enable in-app notifications.',
          read: false,
        },
      ]);
      return;
    }
    setItems(
      data.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        read: r.read_at != null,
      }))
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  const markAllRead = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return;
    }
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    void load();
  }, [load]);

  return (
    <div ref={ref} className="notif-panel-root" style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-outline"
        style={{ padding: '6px 10px', position: 'relative' }}
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5H4v2h16v-2h-2z"
            fill="currentColor"
          />
        </svg>
        {unread > 0 ? (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--rust)',
            }}
          />
        ) : null}
      </button>
      {open ? (
        <div
          className="card notif-panel"
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
          <div className="notif-panel-header">
            <span style={{ fontWeight: 600 }}>Notifications</span>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '4px 8px', fontSize: 11 }}
              onClick={() => void markAllRead()}
            >
              Mark all read
            </button>
          </div>
          {items.map((i) => (
            <div
              key={i.id}
              style={{
                padding: '10px 10px',
                borderTop: '1px solid var(--border)',
                background: i.read ? 'transparent' : 'var(--morning)',
                borderRadius: i.read ? 0 : 6,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{i.title}</div>
              {i.body ? (
                <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 4 }}>{i.body}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
