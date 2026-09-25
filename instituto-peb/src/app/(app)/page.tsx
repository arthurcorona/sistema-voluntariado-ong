import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { buttonClass } from '@/components/ui/button';
import { Page, SectionTitle, StatCard } from '@/components/ui/card';
import { formatDateBR, formatMesAno } from '@/lib/dates';
import { formatBRL, formatCentavos } from '@/lib/money';
import { createClient } from '@/lib/supabase/server';
import { pendenciasDe } from '@/services/lancamentos';
import * as painel from '@/services/painel';

export default async function PainelPage() {
  const db = await createClient();
  const r = await painel.resumo(db);
  const mes = formatMesAno(r.periodo.de);
  const mesMinusculo = mes.charAt(0).toLowerCase() + mes.slice(1);
  const vazio = r.lancados === 0 && r.pendenciasTotal === 0;

  return (
    <Page title={mes} subtitle={`Painel do mês · ${formatDateBR(r.periodo.de)} a ${formatDateBR(r.periodo.ate)}`}>
      {r.semContas && (
        <Alert tone="info" className="mb-6">
          <strong>Primeiro uso.</strong> Antes de lançar notas, cadastre as contas bancárias em{' '}
          <Link href="/cadastros?aba=contas" className="underline">
            Cadastros
          </Link>
          . Fornecedores podem ser criados na hora, direto na tela do lançamento.
        </Alert>
      )}

      {vazio ? (
        <div className="mx-auto my-9 max-w-[620px] text-center">
          <h2 className="mb-3 text-[26px] font-semibold">Nada lançado ainda em {mesMinusculo}</h2>
          <p className="mb-6 text-[15px] leading-relaxed text-neutral-800">
            Comece jogando os anexos que chegaram por e-mail na tela de novo lançamento. Cada arquivo vira um registro pendente e você
            completa os dados em seguida.
          </p>
          <ol className="rounded-md border border-divider bg-neutral-100 p-6 text-left">
            <Passo n={1} titulo="Arraste os arquivos" texto="PDF, JPG, PNG ou XML, vários de uma vez." />
            <Passo n={2} titulo="Complete fornecedor, data, valor e conta" texto="O sistema tenta ler o que consegue do arquivo." />
            <Passo n={3} titulo="Exporte o mês para o contador" texto="CSV, com ou sem os documentos." ultimo />
          </ol>
          <Link href="/envio" className={buttonClass('primary', 'lg', 'mt-6')}>
            Novo lançamento
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-9 grid grid-cols-3 gap-4">
            <StatCard kicker="Total lançado" value={formatBRL(r.totalCentavos)} detail={`${r.lancados} lançamento(s) em ${mesMinusculo}`} />
            <StatCard
              kicker="Não conferidos"
              value={r.pendentesRevisao}
              detail="documentos enviados e ainda não conferidos"
              tone={r.pendentesRevisao > 0 ? 'accent' : 'default'}
            />
            <StatCard
              kicker="Incompletos no mês"
              value={r.incompletos}
              detail="conferidos com algum campo em branco"
              tone={r.incompletos > 0 ? 'accent' : 'default'}
            />
          </div>

          <SectionTitle meta={r.pendenciasTotal === 1 ? '1 item' : `${r.pendenciasTotal} itens`}>O que falta para fechar {mesMinusculo}</SectionTitle>
          {r.pendencias.length === 0 ? (
            <p className="py-6 text-[15px] text-neutral-700">Nenhuma pendência. Tudo que foi enviado está conferido e completo.</p>
          ) : (
            <div className="overflow-auto">
              {r.pendencias.map((l) => {
                const pend = pendenciasDe(l);
                const titulo = l.fornecedor_nome ?? l.descricao ?? (l.numero_nota ? `Nota ${l.numero_nota}` : 'Documento sem dados');
                return (
                  <div
                    key={l.id}
                    className="grid min-w-[760px] grid-cols-[96px_minmax(220px,1fr)_240px_130px_120px] items-center gap-4 border-b border-divider px-2 py-3"
                  >
                    <span className="text-sm tabular-nums text-neutral-700">{l.data_nota ? formatDateBR(l.data_nota) : '—'}</span>
                    <span className="truncate text-[15px]" title={titulo}>
                      {titulo}
                    </span>
                    <span className="truncate text-sm text-neutral-800">{painel.motivoPendencia(l, pend)}</span>
                    <span className="text-right text-[15px] tabular-nums">{l.valor_centavos ? formatCentavos(l.valor_centavos) : '—'}</span>
                    <Link href={`/lancamentos/${l.id}`} className={buttonClass('ghost', 'sm', 'justify-self-end')}>
                      {l.revisado_em ? 'Completar' : 'Conferir'}
                    </Link>
                  </div>
                );
              })}
              {r.pendenciasTotal > r.pendencias.length && (
                <p className="px-2 pt-3 text-[13px] text-neutral-700">
                  Mostrando {r.pendencias.length} de {r.pendenciasTotal}.{' '}
                  <Link href="/lancamentos" className="text-accent-700 hover:underline">
                    Ver todos os lançamentos
                  </Link>
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Link href="/exportar" className={buttonClass('primary', 'lg')}>
              Ir para exportação
            </Link>
            <Link href="/envio" className={buttonClass('secondary', 'lg')}>
              Novo lançamento
            </Link>
          </div>
        </>
      )}
    </Page>
  );
}

function Passo({ n, titulo, texto, ultimo }: { n: number; titulo: string; texto: string; ultimo?: boolean }) {
  return (
    <li className={`flex gap-4 py-4 first:pt-0 last:pb-0 ${ultimo ? '' : 'border-b border-divider'}`}>
      <span className="w-6 text-[22px] font-semibold leading-none tabular-nums text-accent-700">{n}</span>
      <span>
        <span className="block text-[15px]">{titulo}</span>
        <span className="block text-[13px] text-neutral-700">{texto}</span>
      </span>
    </li>
  );
}
