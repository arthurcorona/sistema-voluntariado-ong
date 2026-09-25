import Link from 'next/link';
import { GerarBotoes } from '@/components/exportacoes/gerar-botoes';
import { Alert } from '@/components/ui/alert';
import { Button, buttonClass } from '@/components/ui/button';
import { Page, SectionTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDateBR, todayISO } from '@/lib/dates';
import { formatBRL, formatCentavos } from '@/lib/money';
import { createClient } from '@/lib/supabase/server';
import { periodoSchema } from '@/lib/validation/exportacoes';
import { FORMATO } from '@/services/csv/formato-contador';
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

const SEPARADOR_LABEL: Record<string, string> = { ';': 'ponto e vírgula', ',': 'vírgula', '\t': 'tabulação' };

export default async function ExportarPage({ searchParams }: { searchParams: Promise<{ de?: string; ate?: string }> }) {
  const sp = await searchParams;
  const parsed = periodoSchema.safeParse(sp.de && sp.ate ? sp : periodoPadrao());
  const periodo = parsed.success ? parsed.data : periodoPadrao();

  const db = await createClient();
  const previa = await exportacoes.previa(db, periodo);
  const qtd = previa.linhas.length;

  return (
    <Page title="Exportar" subtitle="Gerar o arquivo do contador">
      <div className="max-w-[1040px]">
        <div className="mb-6 flex flex-wrap items-end gap-6">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-sm">
              <span className="mb-1.5">De</span>
              <span className="block w-40"><Input type="date" name="de" defaultValue={periodo.de} required /></span>
            </label>
            <label className="flex flex-col text-sm">
              <span className="mb-1.5">Até</span>
              <span className="block w-40"><Input type="date" name="ate" defaultValue={periodo.ate} required /></span>
            </label>
            <Button type="submit" variant="secondary">
              Atualizar prévia
            </Button>
            {!parsed.success && <span className="text-sm text-danger-800">Período inválido; usando o padrão.</span>}
          </form>
          <div className="flex gap-8 pb-1">
            <div>
              <div className="kicker">Entram</div>
              <div className="text-[30px] font-semibold leading-[1.2] tabular-nums">{qtd === 1 ? '1 lançamento' : `${qtd} lançamentos`}</div>
            </div>
            <div>
              <div className="kicker">Valor total</div>
              <div className="text-[30px] font-semibold leading-[1.2] tabular-nums">{formatBRL(previa.totalCentavos)}</div>
            </div>
          </div>
        </div>

        {previa.foraPorIncompletos > 0 && (
          <div className="mb-6 rounded-md border border-l-[3px] border-accent-500 bg-accent-100 p-4">
            <div className="text-base text-accent-900">
              {previa.foraPorIncompletos === 1 ? '1 lançamento fica de fora' : `${previa.foraPorIncompletos} lançamentos ficam de fora`}
            </div>
            <div className="mt-1 text-sm leading-relaxed text-accent-800">
              Só entram no arquivo lançamentos conferidos e com fornecedor, data e valor. Os demais campos podem ficar em branco; eles saem
              sinalizados na coluna Pendências.
            </div>
            <div className="mt-3 flex gap-2">
              <Link href={`/lancamentos?de=${periodo.de}&ate=${periodo.ate}`} className={buttonClass('secondary', 'sm')}>
                Ver os lançamentos do período
              </Link>
            </div>
          </div>
        )}

        {previa.jaExportados > 0 && (
          <Alert tone="warning" className="mb-6">
            {previa.jaExportados} lançamento(s) desta prévia já saíram em exportação anterior e vão sair de novo. Se não for a intenção,
            ajuste o período.
          </Alert>
        )}

        <SectionTitle
          className="mb-3"
          meta={`Separador ${SEPARADOR_LABEL[FORMATO.separador] ?? FORMATO.separador} · codificação ${FORMATO.codificacao.toUpperCase()} · formato provisório`}
        >
          Prévia das linhas do arquivo
        </SectionTitle>
        <div className="overflow-auto rounded-md border border-divider bg-neutral-100">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-divider text-left text-[11px] uppercase tracking-[0.1em] text-neutral-700">
                <th className="px-3 py-2.5 font-normal">Data</th>
                <th className="px-3 py-2.5 font-normal">Fornecedor</th>
                <th className="px-3 py-2.5 font-normal">Número</th>
                <th className="px-3 py-2.5 font-normal">Descrição</th>
                <th className="px-3 py-2.5 font-normal">Conta</th>
                <th className="px-3 py-2.5 text-right font-normal">Valor</th>
                <th className="px-3 py-2.5 font-normal">Pendências</th>
              </tr>
            </thead>
            <tbody>
              {qtd === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-neutral-700">
                    Nenhum lançamento apto neste período.
                  </td>
                </tr>
              )}
              {previa.linhas.map((l) => {
                const pend = pendenciasDe(l);
                return (
                  <tr key={l.id} className={`border-b border-divider last:border-b-0 ${l.exportado ? 'text-neutral-600' : ''}`}>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">{l.data_nota ? formatDateBR(l.data_nota) : ''}</td>
                    <td className="max-w-56 truncate px-3 py-2">{l.fornecedor_nome}</td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">{l.numero_nota ?? '—'}</td>
                    <td className="max-w-72 truncate px-3 py-2">{l.descricao ?? '—'}</td>
                    <td className="max-w-40 truncate px-3 py-2">{l.conta_bancaria_nome ?? '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatCentavos(l.valor_centavos ?? 0)}</td>
                    <td className="px-3 py-2 text-[13px]">
                      <span className="text-accent-800">{pend.join(', ')}</span>
                      {l.exportado && <span className={pend.length ? 'ml-1 text-neutral-500' : 'text-neutral-500'}>· já exportado</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <GerarBotoes de={periodo.de} ate={periodo.ate} quantidade={qtd} />
      </div>
    </Page>
  );
}
