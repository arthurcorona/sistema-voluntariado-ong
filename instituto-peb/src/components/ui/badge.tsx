import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'zinc' | 'amber' | 'red' | 'blue' | 'green';

const TONES: Record<Tone, string> = {
  zinc: 'bg-zinc-100 text-zinc-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
};

export function Badge({ tone = 'zinc', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {children}
    </span>
  );
}
