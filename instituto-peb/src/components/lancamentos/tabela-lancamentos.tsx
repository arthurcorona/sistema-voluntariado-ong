'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { atribuirContaEmLote, excluirEmLote } from '@/actions/lancamentos';
import { SituacaoBadge } from '@/components/lancamentos/situacao-badge';
import { Alert } from '@/components/ui/alert';
import { Button, buttonClass } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/card';
import { Select } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { formatDateBR } from '@/lib/dates';
import { formatBRL, formatCentavos } from '@/lib/money';
import type { ContaBancaria, LancamentoView } from '@/types/aliases';

const TH = 'px-3 py-2.5 text-left text-[11px] font-normal uppercase tracking-[0.1em] text-neutral-700';

export function TabelaLancamentos({ linhas, contas, total }: { linhas: LancamentoView[]; contas: ContaBancaria[]; total: number }) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [conta, setConta] = useState('');
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; texto: string } | null>(null);
  const [pending, start] = useTransition();

  const ids = linhas.map((l) => l.id).filter((id): id is string => Boolean(id));
  const todos = ids.length > 0 && ids.every((id) => selecionados.has(id));
  const somaPagina = linhas.reduce((s, l) => s + (l.valor_centavos ?? 0), 0);

  function alternarTodos() {
    setSelecionados(todos ? new Set() : new Set(ids));
  }
  function alternar(id: string) {
    setSelecionados((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function atribuir() {
    if (!conta) return;
    start(async () => {
      const r = await atribuirContaEmLote({ ids: [...selecionados], conta_bancaria_id: conta });
      if (!r.ok) setMsg({ tone: 'error', texto: r.error });
      else {
        setMsg({ tone: 'success', texto: `Conta atribuída a ${r.data.alterados} lançamento(s). Bloqueados não foram alterados.` });
        setSelecionados(new Set());
        router.refresh();
      }
    });
  }

  function excluir() {
    if (!confirm(`Excluir ${selecionados.size} lançamento(s) e seus arquivos? Já exportados não serão excluídos.`)) return;
    start(async () => {
      const r = await excluirEmLote({ ids: [...selecionados] });
      if (!r.ok) setMsg({ tone: 'error', texto: r.error });
      else {
        setMsg({ tone: 'success', texto: `${r.data.excluidos} lançamento(s) excluído(s).` });
        setSelecionados(new Set());
        router.refresh();
      }
    });
  }

  if (linhas.length === 0) {
    return (
      <EmptyState
        title="Nenhum lançamento ainda"
        action={
          <Link href="/envio" className={buttonClass('primary', 'lg')}>
            Subir documentos
          </Link>
        }
      >
        Quando você subir os primeiros documentos, eles aparecem aqui. A lista é o lugar de conferir e completar o que vai para o contador.
        Se você usou filtros, tente limpá-los.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {msg && <Alert tone={msg.tone}>{msg.texto}</Alert>}

      {selecionados.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-accent-500 bg-accent-100 px-4 py-3">
          <span className="text-[15px] tabular-nums">
            {selecionados.size === 1 ? '1 lançamento selecionado' : `${selecionados.size} lançamentos selecionados`}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="w-60">
              <Select value={conta} onChange={(e) => setConta(e.target.value)} className="h-8 min-h-0 bg-bg py-0" aria-label="Conta bancária para atribuir">
                <option value="">Atribuir conta bancária…</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </div>
            <Button size="sm" onClick={atribuir} disabled={!conta || pending} loading={pending}>
              Aplicar
            </Button>
            <Button size="sm" variant="danger" onClick={excluir} disabled={pending}>
              Excluir selecionados
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelecionados(new Set())}>
              Limpar seleção
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-auto rounded-md border border-divider bg-neutral-100">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-divider">
              <th className="w-11 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={todos}
                  onChange={alternarTodos}
                  aria-label="Selecionar todos"
                  className="h-4 w-4 cursor-pointer accent-accent-700"
                />
              </th>
              <th className={TH}>Data</th>
              <th className={TH}>Fornecedor</th>
              <th className={TH}>Número</th>
              <th className={TH}>Descrição</th>
              <th className={TH}>Conta</th>
              <th className={cn(TH, 'text-right')}>Valor</th>
              <th className={TH}>Situação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const id = l.id ?? '';
              const on = selecionados.has(id);
              return (
                <tr key={id} className={cn('border-b border-divider last:border-b-0', on ? 'bg-accent-100' : 'hover:bg-ink/4')}>
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => alternar(id)}
                      aria-label={`Selecionar lançamento de ${l.fornecedor_nome ?? 'fornecedor não informado'}`}
                      className="h-4 w-4 cursor-pointer accent-accent-700"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 tabular-nums">
                    <Link href={`/lancamentos/${id}`} className="text-ink hover:text-accent-700">
                      {l.data_nota ? formatDateBR(l.data_nota) : <span className="text-neutral-500">sem data</span>}
                    </Link>
                  </td>
                  <td className="max-w-56 truncate px-3 py-3 text-[15px]">
                    <Link href={`/lancamentos/${id}`} className="text-ink hover:text-accent-700" title={l.fornecedor_nome ?? undefined}>
                      {l.fornecedor_nome ?? <span className="text-neutral-500">não informado</span>}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 tabular-nums text-neutral-800">
                    {l.numero_nota ?? '—'}
                    {l.serie_nota && <span className="text-neutral-500"> /{l.serie_nota}</span>}
                  </td>
                  <td className="max-w-72 truncate px-3 py-3 text-neutral-800" title={l.descricao ?? undefined}>
                    {l.descricao ?? '—'}
                  </td>
                  <td className="max-w-40 truncate px-3 py-3 text-neutral-800">{l.conta_bancaria_nome ?? '—'}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-[15px] tabular-nums">
                    {l.valor_centavos ? formatCentavos(l.valor_centavos) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="flex items-center gap-2">
                      <SituacaoBadge situacao={l.situacao} />
                      {l.exportado && <span className="text-xs text-neutral-600">exportado</span>}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[13px] tabular-nums text-neutral-700">
        <span>
          {linhas.length} de {total} {total === 1 ? 'lançamento' : 'lançamentos'}
        </span>
        <span>Soma desta página: {formatBRL(somaPagina)}</span>
      </div>
    </div>
  );
}
