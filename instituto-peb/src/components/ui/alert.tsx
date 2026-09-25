import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'error' | 'success' | 'info' | 'warning';

/* Avisos com filete à esquerda, no acento (atenção) ou no vermelho de erro. */
const TONES: Record<Tone, string> = {
  error: 'border-danger-500 border-l-[3px] bg-danger-100 text-danger-800',
  warning: 'border-accent-500 border-l-[3px] bg-accent-100 text-accent-900',
  info: 'border-accent-400 bg-accent-100 text-accent-900',
  success: 'border-neutral-400 border-l-[3px] bg-neutral-200 text-ink',
};

export function Alert({ tone = 'info', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-md border px-4 py-3 text-sm leading-relaxed', TONES[tone], className)}>
      {children}
    </div>
  );
}
