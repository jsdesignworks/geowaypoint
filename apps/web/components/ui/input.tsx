import type { InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Spec §3 — `.rf-input` */
export function Input({ className = '', ...props }: InputProps) {
  return <input className={`rf-input ${className}`.trim()} {...props} />;
}
