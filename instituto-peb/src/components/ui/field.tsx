import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  /** Mostra a etiqueta "lido do arquivo" ao lado do rótulo (RF022). */
  sugestao?: boolean;
  className?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, error, hint, sugestao, className, children }: Props) {
  return (
    <div className={cn('flex flex-col', className)}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-2 text-sm text-ink">
        {label}
        {sugestao && <SugestaoTag />}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[13px] leading-snug text-danger-800" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] leading-snug text-neutral-700">{hint}</p>
      ) : null}
    </div>
  );
}

export function SugestaoTag() {
  return (
    <span className="rounded-sm border border-accent-400 px-1.5 py-px text-[11px] uppercase leading-tight tracking-[0.06em] text-accent-800">
      lido do arquivo
    </span>
  );
}
