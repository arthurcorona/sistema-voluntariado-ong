'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const ITENS = [
  { href: '/', label: 'Painel do mês' },
  { href: '/envio', label: 'Novo lançamento' },
  { href: '/lancamentos', label: 'Lançamentos' },
  { href: '/exportar', label: 'Exportar' },
  { href: '/exportacoes', label: 'Exportações' },
  { href: '/cadastros', label: 'Cadastros' },
];

export function Sidebar({ nome, pendentes, competencia }: { nome: string; pendentes: number; competencia: string }) {
  const pathname = usePathname();
  return (
    <aside className="flex w-[236px] shrink-0 flex-col gap-7 overflow-auto border-r border-divider px-4 py-7">
      <Link href="/" className="flex items-center gap-3 text-ink no-underline">
        <Image src="/logo-peb.png" alt="" width={40} height={40} className="shrink-0 mix-blend-multiply" priority />
        <span>
          <span className="block text-[19px] font-semibold leading-[1.1]">Instituto PEB</span>
          <span className="kicker mt-1 block whitespace-nowrap tracking-[0.08em]">Prestação de contas</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-[3px]" aria-label="Principal">
        {ITENS.map((item) => {
          const ativo = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? 'page' : undefined}
              className={cn(
                'flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-[15px] leading-tight',
                ativo ? 'border-accent-400 bg-accent-100 text-accent-900' : 'border-transparent text-ink hover:bg-neutral-200',
              )}
            >
              {item.label}
              {item.href === '/lancamentos' && pendentes > 0 && (
                <span
                  className="rounded-sm border border-accent-500 bg-accent-100 px-1.5 py-px text-[11px] font-semibold tabular-nums text-accent-900"
                  title="Pendentes de revisão"
                >
                  {pendentes}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-divider pt-4 text-[13px] leading-snug text-neutral-700">
        <p>
          Competência aberta
          <br />
          <span className="text-ink">{competencia}</span>
        </p>
        <p className="mt-4 truncate text-ink" title={nome}>
          {nome}
        </p>
        <form action="/api/sair" method="post">
          <button type="submit" className="mt-0.5 text-[13px] text-neutral-700 hover:text-accent-700 hover:underline">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
