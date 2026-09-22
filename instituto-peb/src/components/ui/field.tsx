import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  /** Mostra a etiqueta "sugerido" ao lado do rótulo (RF022). */
  sugestao?: boolean;
  className?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, error, hint, sugestao, className, children }: Props) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        {label}
        {sugestao && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
            sugerido
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}
