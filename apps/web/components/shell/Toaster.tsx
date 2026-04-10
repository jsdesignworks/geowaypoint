'use client';

import { useEffect, useState } from 'react';
import { GW_TOAST_EVENT, type ToastType } from '@/lib/toast';

export function Toaster() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');

  useEffect(() => {
    const onToast = (e: Event) => {
      const ce = e as CustomEvent<{ message: string; type: ToastType }>;
      setMessage(ce.detail.message);
      setType(ce.detail.type);
      setOpen(true);
      window.setTimeout(() => setOpen(false), 3400);
    };
    window.addEventListener(GW_TOAST_EVENT, onToast);
    return () => window.removeEventListener(GW_TOAST_EVENT, onToast);
  }, []);

  if (!open) return null;

  const bg =
    type === 'success'
      ? 'var(--canopy)'
      : type === 'error'
        ? 'var(--rust)'
        : 'var(--sky)';

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 600,
        padding: '12px 20px',
        borderRadius: 'var(--r8)',
        background: bg,
        color: '#fff',
        fontSize: 14,
        fontFamily: 'var(--font-ui), system-ui, sans-serif',
        boxShadow: '0 8px 24px var(--shadow2)',
      }}
    >
      {message}
    </div>
  );
}
