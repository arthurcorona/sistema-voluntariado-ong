import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LancamentoEditor } from '@/components/lancamentos/lancamento-editor';
import { Visualizador } from '@/components/lancamentos/visualizador';
import { createClient } from '@/lib/supabase/server';
import { carregarParaEdicao } from '@/services/lancamentos';

export default async function LancamentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fila?: string }>;
}) {
  const { id } = await params;
  const { fila } = await searchParams;
  const db = await createClient();
  const dados = await carregarParaEdicao(db, id);
  if (!dados) notFound();

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          {dados.lancamento.revisado_em ? 'Lançamento' : 'Revisar documento'}
          <span className="ml-2 text-sm font-normal text-zinc-500">
            {dados.anexos[0]?.nome_original ?? 'sem arquivo'}
          </span>
        </h1>
        <Link href="/lancamentos" className="text-sm text-blue-700 hover:underline">
          ← Lista
        </Link>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)] gap-4">
        <Visualizador lancamentoId={id} anexos={dados.anexos} bloqueado={Boolean(dados.lancamento.bloqueado)} />
        <div className="min-h-0 overflow-auto rounded-lg border border-zinc-200 bg-white p-4">
          <LancamentoEditor id={id} dados={dados} fila={fila === '1'} />
        </div>
      </div>
    </div>
  );
}
