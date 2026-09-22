import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/ui/card';
import { formatDateBR } from '@/lib/dates';
import { formatBRL } from '@/lib/money';
import { createClient } from '@/lib/supabase/server';
import * as exportacoes from '@/services/exportacoes';

export default async function ExportacoesPage() {
  const db = await createClient();
  const lista = await exportacoes.listar(db);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Histórico de exportações"
        description="Tudo que já foi gerado para a contabilidade. Baixe de novo quando precisar."
        actions={
          <Link href="/exportar">
            <Button>Nova exportação</Button>
          </Link>
        }
      />

      {lista.length === 0 ? (
        <EmptyState title="Nenhuma exportação ainda.">
          <Link href="/exportar" className="text-blue-700 hover:underline">
            Gerar a primeira
          </Link>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2">Período</th>
                <th className="px-3 py-2">Gerada em</th>
                <th className="px-3 py-2">Por</th>
                <th className="px-3 py-2 text-right">Lançamentos</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Baixar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {lista.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                    {formatDateBR(e.periodo_inicio)} a {formatDateBR(e.periodo_fim)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                    {new Date(e.gerada_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-3 py-2">{e.autor_nome ?? '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{e.total_lancamentos}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatBRL(e.total_centavos)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <a href={`/api/exportacoes/${e.id}/csv`} className="text-blue-700 hover:underline">
                      CSV
                    </a>
                    <span className="mx-2 text-zinc-300">|</span>
                    <a href={`/api/exportacoes/${e.id}/zip`} className="text-blue-700 hover:underline">
                      ZIP com documentos
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
