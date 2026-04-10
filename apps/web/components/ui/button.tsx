import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'outline' | 'danger' | 'grove';

const variantClass: Record<Variant, string> = {
  primary: 'btn btn-primary',
  grove: 'btn btn-grove',
  outline: 'btn btn-outline',
  danger: 'btn btn-danger',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

/** Spec §3 — `.btn` / `.btn-primary` / `.btn-outline` / `.btn-danger` */
export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={`${variantClass[variant]} ${className}`.trim()} {...props} />
  );
}
