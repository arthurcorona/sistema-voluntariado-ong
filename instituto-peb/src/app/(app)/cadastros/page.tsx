import Link from 'next/link';
import { Suspense } from 'react';
import { Busca } from '@/components/cadastros/busca';
import { ContasTab } from '@/components/cadastros/contas-tab';
import { FornecedoresTab } from '@/components/cadastros/fornecedores-tab';
import { Page } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { createClient } from '@/lib/supabase/server';
import * as contas from '@/services/contas-bancarias';
import * as fornecedores from '@/services/fornecedores';

type Aba = 'fornecedores' | 'contas';

export default async function CadastrosPage({ searchParams }: { searchParams: Promise<{ aba?: string; q?: string }> }) {
  const sp = await searchParams;
  const aba: Aba = sp.aba === 'contas' ? 'contas' : 'fornecedores';
  const q = sp.q?.trim() || undefined;
  const db = await createClient();

  const lista =
    aba === 'fornecedores' ? await fornecedores.listar(db, { busca: q }) : await contas.listar(db, { busca: q });

  return (
    <Page title="Cadastros" subtitle="Fornecedores e contas bancárias. Nada aqui é excluído; o que sai de uso é inativado.">
      <div className="max-w-[1040px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <nav className="flex w-fit gap-0.5 rounded-md border border-divider bg-neutral-100 p-[3px]" aria-label="Abas">
            {(
              [
                ['fornecedores', 'Fornecedores'],
                ['contas', 'Contas bancárias'],
              ] as const
            ).map(([key, label]) => (
              <Link
                key={key}
                href={`/cadastros?aba=${key}`}
                aria-current={aba === key ? 'page' : undefined}
                className={cn(
                  'rounded-[3px] px-5 py-2 text-[15px] font-semibold leading-tight',
                  aba === key ? 'bg-bg text-accent-900 shadow-sm' : 'text-neutral-700 hover:text-ink',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <Suspense>
            <Busca placeholder={aba === 'fornecedores' ? 'Buscar fornecedor' : 'Buscar conta'} />
          </Suspense>
        </div>

        {aba === 'fornecedores' ? (
          <FornecedoresTab fornecedores={lista as Awaited<ReturnType<typeof fornecedores.listar>>} busca={q} />
        ) : (
          <ContasTab contas={lista as Awaited<ReturnType<typeof contas.listar>>} busca={q} />
        )}
      </div>
    </Page>
  );
}
