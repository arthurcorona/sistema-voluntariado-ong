'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { atribuirContaEmLote, excluirEmLote } from '@/actions/lancamentos';
import { SituacaoBadge } from '@/components/lancamentos/situacao-badge';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/card';
import { Select } from '@/components/ui/input';
import { formatDateBR } from '@/lib/dates';
import { formatCentavos } from '@/lib/money';
import type { ContaBancaria, LancamentoView } from '@/types/aliases';

export function TabelaLancamentos({ linhas, contas }: { linhas: LancamentoView[]; contas: ContaBancaria[] }) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [conta, setConta] = useState('');
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; texto: string } | null>(null);
  const [pending, start] = useTransition();

  const ids = linhas.map((l) => l.id).filter((id): id is string => Boolean(id));
  const todos = ids.length > 0 && ids.every((id) => selecionados.has(id));

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
      <EmptyState title="Nenhum lançamento com estes filtros.">
        <Link href="/envio" className="text-blue-700 hover:underline">
          Enviar documentos
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {msg && <Alert tone={msg.tone}>{msg.texto}</Alert>}

      {selecionados.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
          <span className="font-medium text-blue-900">{selecionados.size} selecionado(s)</span>
          <span className="mx-1 text-blue-300">|</span>
          <Select value={conta} onChange={(e) => setConta(e.target.value)} className="h-8 w-56" aria-label="Conta bancária para atribuir">
            <option value="">Atribuir conta bancária…</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
          <Button size="sm" variant="secondary" disabled={!conta || pending} onClick={atribuir}>
            Aplicar
          </Button>
          <span className="flex-1" />
          <Button size="sm" variant="danger" disabled={pending} onClick={excluir}>
            Excluir selecionados
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="w-8 px-3 py-2">
                <input type="checkbox" checked={todos} onChange={alternarTodos} aria-label="Selecionar todos" />
              </th>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Fornecedor</th>
              <th className="px-3 py-2">Número</th>
              <th className="px-3 py-2">Descrição</th>
              <th className="px-3 py-2">Conta</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {linhas.map((l) => {
              const id = l.id ?? '';
              return (
                <tr key={id} className={selecionados.has(id) ? 'bg-blue-50/50' : 'hover:bg-zinc-50'}>
                  <td className="px-3 py-1.5">
                    <input type="checkbox" checked={selecionados.has(id)} onChange={() => alternar(id)} aria-label="Selecionar" />
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 tabular-nums">
                    <Link href={`/lancamentos/${id}`} className="block text-blue-800 hover:underline">
                      {l.data_nota ? formatDateBR(l.data_nota) : <span className="text-zinc-400">sem data</span>}
                    </Link>
                  </td>
                  <td className="max-w-56 truncate px-3 py-1.5" title={l.fornecedor_nome ?? ''}>
                    {l.fornecedor_nome ?? <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 tabular-nums">
                    {l.numero_nota ?? <span className="text-zinc-400">—</span>}
                    {l.serie_nota && <span className="text-zinc-400"> /{l.serie_nota}</span>}
                  </td>
                  <td className="max-w-72 truncate px-3 py-1.5" title={l.descricao ?? ''}>
                    {l.descricao ?? <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="max-w-40 truncate px-3 py-1.5">{l.conta_bancaria_nome ?? <span className="text-zinc-400">—</span>}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">
                    {l.valor_centavos != null ? formatCentavos(l.valor_centavos) : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5">
                    <SituacaoBadge situacao={l.situacao} />
                    {l.exportado && (
                      <span className="ml-1 text-xs text-zinc-500" title="Já incluído em exportação">
                        · exportado
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
