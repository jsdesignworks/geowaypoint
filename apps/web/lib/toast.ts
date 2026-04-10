/** Spec §3 — toast types; auto-dismiss ~3.4s via listener in Toaster. */
export type ToastType = 'success' | 'info' | 'error';

export const GW_TOAST_EVENT = 'gw-toast';

export function toast(message: string, type: ToastType = 'info'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(GW_TOAST_EVENT, { detail: { message, type } }));
}
