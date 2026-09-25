import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';
import { EmptyState, Page } from '@/components/ui/card';
import { formatDateBR } from '@/lib/dates';
import { formatBRL } from '@/lib/money';
import { createClient } from '@/lib/supabase/server';
import * as exportacoes from '@/services/exportacoes';

const FUSO = 'America/Sao_Paulo';

export default async function ExportacoesPage() {
  const db = await createClient();
  const lista = await exportacoes.listar(db);

  return (
    <Page
      title="Exportações"
      subtitle="Tudo que já foi enviado ao contador. Baixe de novo quando precisar."
      actions={
        <Link href="/exportar" className={buttonClass('primary')}>
          Nova exportação
        </Link>
      }
    >
      {lista.length === 0 ? (
        <EmptyState
          title="Nenhuma exportação ainda"
          action={
            <Link href="/exportar" className={buttonClass('primary', 'lg')}>
              Gerar a primeira
            </Link>
          }
        >
          Quando você gerar o arquivo do contador, ele fica registrado aqui com período, data, autor e total.
        </EmptyState>
      ) : (
        <div className="max-w-[1040px] overflow-auto rounded-md border border-divider bg-neutral-100">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-divider text-left text-[11px] uppercase tracking-[0.1em] text-neutral-700">
                <th className="px-4 py-2.5 font-normal">Período</th>
                <th className="px-4 py-2.5 font-normal">Gerada em</th>
                <th className="px-4 py-2.5 font-normal">Por</th>
                <th className="px-4 py-2.5 text-right font-normal">Lançamentos</th>
                <th className="px-4 py-2.5 text-right font-normal">Valor total</th>
                <th className="px-4 py-2.5 font-normal" />
              </tr>
            </thead>
            <tbody>
              {lista.map((e) => (
                <tr key={e.id} className="border-b border-divider last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-3 text-[15px] tabular-nums">
                    {formatDateBR(e.periodo_inicio)} a {formatDateBR(e.periodo_fim)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-800">
                    {new Date(e.gerada_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: FUSO })}
                  </td>
                  <td className="px-4 py-3 text-neutral-800">{e.autor_nome ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-[15px] tabular-nums">{e.total_lancamentos}</td>
                  <td className="px-4 py-3 text-right text-[15px] tabular-nums">{formatBRL(e.total_centavos)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="flex justify-end gap-2">
                      <a href={`/api/exportacoes/${e.id}/csv`} className={buttonClass('ghost', 'sm')}>
                        CSV
                      </a>
                      <a href={`/api/exportacoes/${e.id}/zip`} className={buttonClass('ghost', 'sm')}>
                        Pacote
                      </a>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
