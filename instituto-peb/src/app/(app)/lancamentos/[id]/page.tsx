import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LancamentoEditor } from '@/components/lancamentos/lancamento-editor';
import { Visualizador } from '@/components/lancamentos/visualizador';
import { buttonClass } from '@/components/ui/button';
import { Page } from '@/components/ui/card';
import { formatDateBR } from '@/lib/dates';
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

  const l = dados.lancamento;
  const arquivo = dados.anexos[0]?.nome_original;
  const titulo = l.fornecedor_nome ?? (l.revisado_em ? 'Lançamento' : 'Revisar documento');
  const subtitulo = l.data_nota ? `Lançamento de ${formatDateBR(l.data_nota)}` : (arquivo ?? 'Sem arquivo anexado');

  return (
    <Page
      title={titulo}
      subtitle={subtitulo}
      actions={
        <Link href="/lancamentos" className={buttonClass('ghost')}>
          Voltar à lista
        </Link>
      }
      contentClassName="flex flex-col overflow-hidden"
    >
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(360px,1fr)_minmax(420px,1fr)] gap-8">
        <Visualizador lancamentoId={id} anexos={dados.anexos} bloqueado={Boolean(l.bloqueado)} />
        <div className="min-h-0 overflow-auto pr-1">
          <LancamentoEditor id={id} dados={dados} fila={fila === '1'} />
        </div>
      </div>
    </Page>
  );
}
