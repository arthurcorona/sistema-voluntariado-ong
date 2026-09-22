'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { desbloquearLancamento, excluirLancamento, proximoPendente, salvarLancamento } from '@/actions/lancamentos';
import { FornecedorCombobox } from '@/components/lancamentos/fornecedor-combobox';
import { SituacaoBadge } from '@/components/lancamentos/situacao-badge';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import type { FieldErrors } from '@/lib/action-result';
import { formatDateBR } from '@/lib/dates';
import { formatBRL, formatCentavos } from '@/lib/money';
import type { LancamentoParaEdicao } from '@/services/lancamentos';
import type { Fornecedor } from '@/types/aliases';

type Origem = 'salvo' | 'sugestao' | 'digitado' | 'vazio';
type Campo = { valor: string; origem: Origem };

function campo(salvo: string | null | undefined, sugestao: string | undefined): Campo {
  if (salvo) return { valor: salvo, origem: 'salvo' };
  if (sugestao) return { valor: sugestao, origem: 'sugestao' };
  return { valor: '', origem: 'vazio' };
}

type Mensagem = { tone: 'success' | 'error'; texto: string } | null;

export function LancamentoForm({
  dados,
  fila,
  onMensagem,
}: {
  dados: LancamentoParaEdicao;
  fila: boolean;
  /** Mensagem de resultado vive no componente pai, que não é remontado. */
  onMensagem: (m: Mensagem) => void;
}) {
  const { lancamento: l, sugestoes: s, exportacoes, contas } = dados;
  const router = useRouter();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(dados.fornecedores);

  const [fornecedorId, setFornecedorId] = useState<Campo>(campo(l.fornecedor_id, s.fornecedor_id));
  const [numero, setNumero] = useState<Campo>(campo(l.numero_nota, s.numero_nota));
  const [serie, setSerie] = useState<Campo>(campo(l.serie_nota, s.serie_nota));
  const [data, setData] = useState<Campo>(campo(l.data_nota ? formatDateBR(l.data_nota) : null, s.data_nota ? formatDateBR(s.data_nota) : undefined));
  const [valor, setValor] = useState<Campo>(campo(l.valor_centavos ? formatCentavos(l.valor_centavos) : null, s.valor_centavos ? formatCentavos(s.valor_centavos) : undefined));
  const [descricao, setDescricao] = useState<Campo>(campo(l.descricao, undefined));
  const [contaId, setContaId] = useState<Campo>(campo(l.conta_bancaria_id, undefined));

  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const bloqueado = Boolean(l.bloqueado);
  const temSugestao = [fornecedorId, numero, serie, data, valor].some((c) => c.origem === 'sugestao');

  const set = (setter: (c: Campo) => void) => (valor: string) => setter({ valor, origem: 'digitado' });

  function submeter(lancar: boolean) {
    setErro(null);
    onMensagem(null);
    setFieldErrors({});
    start(async () => {
      const r = await salvarLancamento({
        id: l.id,
        fornecedor_id: fornecedorId.valor || null,
        numero_nota: numero.valor,
        serie_nota: serie.valor,
        data_nota: data.valor,
        valor_centavos: valor.valor,
        descricao: descricao.valor,
        conta_bancaria_id: contaId.valor || null,
        lancar,
        irParaProximo: fila && lancar,
      });
      if (!r.ok) {
        setErro(r.fieldErrors ? r.error : r.error);
        setFieldErrors(r.fieldErrors ?? {});
        return;
      }
      if (fila && lancar) {
        if (r.data.proximoId) router.push(`/lancamentos/${r.data.proximoId}?fila=1`);
        else router.push('/lancamentos?situacao=&aviso=fila-concluida');
        return;
      }
      onMensagem({ tone: 'success', texto: lancar ? 'Lançado.' : 'Salvo sem lançar.' });
      router.refresh();
    });
  }

  function pular() {
    start(async () => {
      const r = await proximoPendente({ aposId: l.id });
      if (r.ok && r.data.id) router.push(`/lancamentos/${r.data.id}?fila=1`);
      else router.push('/lancamentos');
    });
  }

  function excluir() {
    if (!confirm('Excluir este lançamento e seus arquivos? Não dá para desfazer.')) return;
    start(async () => {
      const r = await excluirLancamento({ id: l.id });
      if (!r.ok) setErro(r.error);
      else router.push(fila ? '/envio' : '/lancamentos');
    });
  }

  function desbloquear() {
    if (!confirm('Este lançamento já foi enviado ao contador. Desbloquear para editar mesmo assim?')) return;
    start(async () => {
      const r = await desbloquearLancamento({ id: l.id });
      if (!r.ok) setErro(r.error);
      else router.refresh();
    });
  }

  // Ctrl+Enter = Lançar (RF039).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!bloqueado && !pending) submeter(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fornecedorId, numero, serie, data, valor, descricao, contaId, bloqueado, pending]);

  const sug = (c: Campo) => c.origem === 'sugestao';

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!bloqueado) submeter(true);
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SituacaoBadge situacao={l.situacao} />
        {l.exportado && (
          <span className="text-xs text-zinc-600">
            Exportado em{' '}
            {exportacoes.map((e, i) => (
              <span key={e.id}>
                {i > 0 && ', '}
                <Link href="/exportacoes" className="text-blue-700 hover:underline">
                  {formatDateBR(e.gerada_em.slice(0, 10))}
                </Link>
              </span>
            ))}
          </span>
        )}
      </div>

      {bloqueado && (
        <Alert tone="warning">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Este lançamento já foi exportado e está bloqueado para edição.</span>
            <Button type="button" size="sm" variant="secondary" onClick={desbloquear} disabled={pending}>
              Desbloquear para editar
            </Button>
          </div>
        </Alert>
      )}

      {temSugestao && !bloqueado && (
        <Alert tone="warning">
          Campos em amarelo foram lidos do arquivo. Confira antes de lançar; qualquer um pode ser corrigido.
        </Alert>
      )}

      {erro && <Alert tone="error">{erro}</Alert>}

      <fieldset disabled={bloqueado || pending} className="flex flex-col gap-4 disabled:opacity-70">
        <Field label="Fornecedor" htmlFor="fornecedor" error={fieldErrors.fornecedor_id} sugestao={sug(fornecedorId)}>
          <FornecedorCombobox
            id="fornecedor"
            fornecedores={fornecedores}
            value={fornecedorId.valor || null}
            onChange={(id) => setFornecedorId({ valor: id ?? '', origem: id ? 'digitado' : 'vazio' })}
            onNovoFornecedor={(f) => setFornecedores((prev) => [...prev, f].sort((a, b) => a.nome.localeCompare(b.nome)))}
            sugestao={sug(fornecedorId)}
            novoSugerido={s.novoFornecedor}
            invalid={Boolean(fieldErrors.fornecedor_id)}
          />
        </Field>

        <div className="grid grid-cols-[1fr_5rem] gap-3">
          <Field label="Número da nota" htmlFor="numero" error={fieldErrors.numero_nota} sugestao={sug(numero)}>
            <Input id="numero" value={numero.valor} onChange={(e) => set(setNumero)(e.target.value)} data-sugestao={sug(numero) || undefined} inputMode="numeric" />
          </Field>
          <Field label="Série" htmlFor="serie" error={fieldErrors.serie_nota} sugestao={sug(serie)}>
            <Input id="serie" value={serie.valor} onChange={(e) => set(setSerie)(e.target.value)} data-sugestao={sug(serie) || undefined} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Data da nota" htmlFor="data" error={fieldErrors.data_nota} sugestao={sug(data)} hint="DD/MM/AAAA">
            <Input id="data" value={data.valor} onChange={(e) => set(setData)(e.target.value)} placeholder="31/12/2026" inputMode="numeric" data-sugestao={sug(data) || undefined} />
          </Field>
          <Field label="Valor (R$)" htmlFor="valor" error={fieldErrors.valor_centavos} sugestao={sug(valor)}>
            <Input id="valor" value={valor.valor} onChange={(e) => set(setValor)(e.target.value)} placeholder="1.234,56" inputMode="decimal" className="text-right tabular-nums" data-sugestao={sug(valor) || undefined} />
          </Field>
        </div>

        <Field label="Descrição do item" htmlFor="descricao" error={fieldErrors.descricao}>
          <Textarea id="descricao" value={descricao.valor} onChange={(e) => set(setDescricao)(e.target.value)} rows={2} placeholder="O que foi comprado ou contratado" />
        </Field>

        <Field label="Conta bancária" htmlFor="conta" error={fieldErrors.conta_bancaria_id}>
          <Select id="conta" value={contaId.valor} onChange={(e) => set(setContaId)(e.target.value)}>
            <option value="">— não informada —</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {!c.ativo ? ' (inativa)' : ''}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>

      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4">
        <Button type="submit" loading={pending} disabled={bloqueado} title="Ctrl+Enter">
          {fila ? 'Lançar e ir para o próximo' : l.revisado_em ? 'Salvar' : 'Lançar'}
        </Button>
        {!l.revisado_em && (
          <Button type="button" variant="secondary" disabled={pending || bloqueado} onClick={() => submeter(false)}>
            Salvar sem lançar
          </Button>
        )}
        {fila && (
          <Button type="button" variant="ghost" disabled={pending} onClick={pular}>
            Pular
          </Button>
        )}
        <span className="flex-1" />
        {!l.exportado && (
          <Button type="button" variant="danger" size="sm" disabled={pending} onClick={excluir}>
            Excluir
          </Button>
        )}
      </div>

      <p className="text-xs text-zinc-500">
        <kbd className="rounded border px-1">Ctrl</kbd>+<kbd className="rounded border px-1">Enter</kbd> lança. Nenhum campo é obrigatório; o que faltar
        aparece como pendência.
        {l.valor_centavos ? ` · Valor salvo: ${formatBRL(l.valor_centavos)}` : ''}
      </p>
    </form>
  );
}
