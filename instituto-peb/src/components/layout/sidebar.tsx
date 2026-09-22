'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const ITENS = [
  { href: '/', label: 'Painel' },
  { href: '/envio', label: 'Enviar documentos' },
  { href: '/lancamentos', label: 'Lançamentos' },
  { href: '/exportar', label: 'Exportar' },
  { href: '/exportacoes', label: 'Histórico de exportações' },
  { href: '/cadastros', label: 'Cadastros' },
];

export function Sidebar({ nome, pendentes }: { nome: string; pendentes: number }) {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Instituto PEB</p>
        <p className="font-semibold text-zinc-900">Notas fiscais</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Principal">
        {ITENS.map((item) => {
          const ativo = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between rounded-md px-3 py-2 text-sm',
                ativo ? 'bg-blue-50 font-medium text-blue-800' : 'text-zinc-700 hover:bg-zinc-100',
              )}
            >
              {item.label}
              {item.href === '/lancamentos' && pendentes > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800" title="Pendentes de revisão">
                  {pendentes}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 px-4 py-3 text-sm">
        <p className="truncate font-medium text-zinc-800">{nome}</p>
        <form action="/api/sair" method="post">
          <button type="submit" className="mt-1 text-xs text-zinc-500 hover:text-zinc-800 hover:underline">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
