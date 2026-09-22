import Link from 'next/link';
import { Suspense } from 'react';
import { Busca } from '@/components/cadastros/busca';
import { ContasTab } from '@/components/cadastros/contas-tab';
import { FornecedoresTab } from '@/components/cadastros/fornecedores-tab';
import { PageHeader } from '@/components/ui/card';
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
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Cadastros" description="Fornecedores e contas bancárias. Nada aqui é excluído; o que sai de uso é inativado." />

      <div className="mb-4 flex items-center justify-between gap-4 border-b border-zinc-200">
        <nav className="flex gap-1" aria-label="Abas">
          {(
            [
              ['fornecedores', 'Fornecedores'],
              ['contas', 'Contas bancárias'],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key}
              href={`/cadastros?aba=${key}`}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
                aba === key ? 'border-blue-700 text-blue-800' : 'border-transparent text-zinc-600 hover:text-zinc-900',
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
  );
}
