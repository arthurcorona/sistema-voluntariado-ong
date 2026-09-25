import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-md border border-divider p-4', className)}>{children}</div>;
}

/** Número grande com rótulo, para o painel e a exportação. */
export function StatCard({
  kicker,
  value,
  detail,
  tone = 'default',
  className,
}: {
  kicker: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: 'default' | 'accent';
  className?: string;
}) {
  const accent = tone === 'accent';
  return (
    <Card className={cn('px-6 py-4', accent && 'border-accent-400', className)}>
      <div className={cn('kicker', accent && 'text-accent-700')}>{kicker}</div>
      <div className={cn('mt-2 text-[38px] font-semibold leading-[1.1] tabular-nums', accent && 'text-accent-800')}>{value}</div>
      {detail && <div className="mt-0.5 text-[13px] text-neutral-700">{detail}</div>}
    </Card>
  );
}

/**
 * Estrutura de toda tela autenticada: cabeçalho com título grande e
 * subtítulo, ações à direita, e área de conteúdo com rolagem própria.
 */
export function Page({
  title,
  subtitle,
  actions,
  children,
  contentClassName,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <>
      <header className="flex shrink-0 items-end justify-between gap-6 border-b border-divider px-9 pb-4 pt-7">
        <div className="min-w-0">
          <h1 className="truncate text-[30px] font-semibold leading-tight">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-neutral-700">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className={cn('min-h-0 flex-1 overflow-auto px-9 pb-9 pt-7', contentClassName)}>{children}</div>
    </>
  );
}

/** Título de seção com linha embaixo e informação à direita. */
export function SectionTitle({ children, meta, className }: { children: ReactNode; meta?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-2 flex items-baseline justify-between gap-4 border-b border-divider pb-2', className)}>
      <h3 className="text-[21px] font-semibold">{children}</h3>
      {meta && <span className="text-[13px] text-neutral-700">{meta}</span>}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto my-9 max-w-[560px] text-center">
      <h3 className="mb-3 text-[26px] font-semibold">{title}</h3>
      {children && <div className="text-[15px] leading-relaxed text-neutral-800">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
