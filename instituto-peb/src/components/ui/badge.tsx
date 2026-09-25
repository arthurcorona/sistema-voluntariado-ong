import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'accent' | 'muted' | 'alert' | 'danger';

/* Etiquetas em caixa alta com traço, como no mockup. */
const TONES: Record<Tone, string> = {
  neutral: 'border-neutral-400 text-neutral-800',
  accent: 'border-accent-500 text-accent-800',
  muted: 'border-neutral-400 bg-neutral-200 text-neutral-800',
  alert: 'border-accent-500 bg-accent-100 text-accent-900',
  danger: 'border-danger-500 text-danger-800',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-sm border px-2 py-[3px] text-[11px] uppercase leading-tight tracking-[0.04em]',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
