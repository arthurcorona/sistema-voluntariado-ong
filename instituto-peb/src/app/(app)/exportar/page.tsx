import { GerarBotoes } from '@/components/exportacoes/gerar-botoes';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, PageHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDateBR, todayISO } from '@/lib/dates';
import { formatBRL, formatCentavos } from '@/lib/money';
import { createClient } from '@/lib/supabase/server';
import { periodoSchema } from '@/lib/validation/exportacoes';
import { pendenciasDe } from '@/services/lancamentos';
import * as exportacoes from '@/services/exportacoes';

function periodoPadrao(): { de: string; ate: string } {
  // Até o dia 10, o mês anterior costuma ser o que se fecha; depois, o atual.
  const hoje = todayISO();
  const [y, m, d] = hoje.split('-').map(Number);
  const alvo = d <= 10 ? new Date(Date.UTC(y, m - 2, 1)) : new Date(Date.UTC(y, m - 1, 1));
  const fim = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0));
  const iso = (dt: Date) => dt.toISOString().slice(0, 10);
  return { de: iso(alvo), ate: iso(fim) };
}

export default async function ExportarPage({ searchParams }: { searchParams: Promise<{ de?: string; ate?: string }> }) {
  const sp = await searchParams;
  const parsed = periodoSchema.safeParse(sp.de && sp.ate ? sp : periodoPadrao());
  const periodo = parsed.success ? parsed.data : periodoPadrao();

  const db = await createClient();
  const previa = await exportacoes.previa(db, periodo);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Exportar para a contabilidade"
        description="Entram todos os lançamentos revisados com fornecedor, data e valor. Os incompletos nos demais campos saem sinalizados na coluna Pendências."
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
          De
          <Input type="date" name="de" defaultValue={periodo.de} className="h-9 w-40" required />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
          Até
          <Input type="date" name="ate" defaultValue={periodo.ate} className="h-9 w-40" required />
        </label>
        <Button type="submit" size="sm" variant="secondary" className="h-9">
          Atualizar prévia
        </Button>
        {!parsed.success && <span className="text-sm text-red-700">Período inválido; usando o padrão.</span>}
      </form>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Lançamentos no arquivo</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{previa.linhas.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatBRL(previa.totalCentavos)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Ficam de fora</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{previa.foraPorIncompletos}</p>
          <p className="text-xs text-zinc-500">sem revisão, fornecedor, data ou valor</p>
        </Card>
      </div>

      {previa.jaExportados > 0 && (
        <Alert tone="warning" className="mb-4">
          {previa.jaExportados} lançamento(s) desta prévia já saíram em exportação anterior e vão sair de novo. Se não for a intenção,
          ajuste o período.
        </Alert>
      )}

      <div className="mb-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Fornecedor</th>
              <th className="px-3 py-2">Número</th>
              <th className="px-3 py-2">Descrição</th>
              <th className="px-3 py-2">Conta</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2">Pendências</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {previa.linhas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-zinc-500">
                  Nenhum lançamento apto neste período.
                </td>
              </tr>
            )}
            {previa.linhas.map((l) => {
              const pend = pendenciasDe(l);
              return (
                <tr key={l.id} className={l.exportado ? 'text-zinc-500' : ''}>
                  <td className="whitespace-nowrap px-3 py-1.5 tabular-nums">{l.data_nota ? formatDateBR(l.data_nota) : ''}</td>
                  <td className="max-w-56 truncate px-3 py-1.5">{l.fornecedor_nome}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 tabular-nums">{l.numero_nota ?? '—'}</td>
                  <td className="max-w-72 truncate px-3 py-1.5">{l.descricao ?? '—'}</td>
                  <td className="max-w-40 truncate px-3 py-1.5">{l.conta_bancaria_nome ?? '—'}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">{formatCentavos(l.valor_centavos ?? 0)}</td>
                  <td className="px-3 py-1.5 text-xs text-amber-800">
                    {pend.join(', ')}
                    {l.exportado && <span className="ml-1 text-zinc-400">· já exportado</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <GerarBotoes de={periodo.de} ate={periodo.ate} quantidade={previa.linhas.length} />
    </div>
  );
}
