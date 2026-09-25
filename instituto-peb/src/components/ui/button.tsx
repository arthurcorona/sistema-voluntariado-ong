import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

/* Botões contornados, como no mockup: o primário é o acento em traço, não em bloco. */
const VARIANTS: Record<Variant, string> = {
  primary: 'border-accent-500 text-accent-700 hover:bg-accent-500/12 active:bg-accent-500/22',
  secondary: 'border-divider text-ink hover:bg-ink/7 active:bg-ink/14',
  danger: 'border-danger-500 text-danger-800 hover:bg-danger-100 active:bg-danger-100',
  ghost: 'border-transparent text-accent-700 hover:bg-accent-500/10 active:bg-accent-500/18',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-5 text-[15px]',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-md border font-semibold leading-none transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-45',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button {...rest} disabled={disabled || loading} className={buttonClass(variant, size, className)}>
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}
