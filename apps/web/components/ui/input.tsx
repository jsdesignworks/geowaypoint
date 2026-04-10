import type { InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Staging auth card — white field, 1.5px border */
  variant?: 'default' | 'auth';
};

/** Spec §3 — `.rf-input` or staging `.gw-auth-input` */
export function Input({ className = '', variant = 'default', ...props }: InputProps) {
  const base = variant === 'auth' ? 'gw-auth-input' : 'rf-input';
  return <input className={`${base} ${className}`.trim()} {...props} />;
}
