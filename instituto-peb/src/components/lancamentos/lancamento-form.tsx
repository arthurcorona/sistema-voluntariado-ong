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
import { formatarDocumento } from '@/lib/documento';
import { formatBRL, formatCentavos } from '@/lib/money';
import { pendenciasDe } from '@/lib/pendencias';
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
  const sugeridos = [fornecedorId, numero, serie, data, valor].filter((c) => c.origem === 'sugestao').length;
  const fornecedorSalvo = fornecedores.find((f) => f.id === l.fornecedor_id) ?? null;
  // O aviso descreve os dados salvos; atualiza depois de salvar/lançar a nota.
  const pendencias = pendenciasDe(l);

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
      {l.exportado && (
        <div className="rounded-md border border-neutral-400 bg-neutral-200 px-4 py-3 text-sm leading-relaxed">
          Este lançamento já saiu na exportação de{' '}
          {exportacoes.map((e, i) => (
            <span key={e.id}>
              {i > 0 && ', '}
              <Link href="/exportacoes" className="text-accent-700 hover:underline">
                {formatDateBR(e.gerada_em.slice(0, 10))}
              </Link>
            </span>
          ))}
          {bloqueado ? ' e está bloqueado para edição' : ''}. Editar agora deixa o arquivo do contador diferente do sistema.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SituacaoBadge situacao={l.situacao} />
        {pendencias.length > 0 && (
          <span className="text-[13px] text-neutral-700">Falta: {pendencias.join(', ').toLowerCase()}</span>
        )}
        {l.numero_nota && (
          <span className="text-[13px] text-neutral-700">
            Nota fiscal {l.numero_nota}
            {l.serie_nota ? ` · série ${l.serie_nota}` : ''}
          </span>
        )}
        {bloqueado && (
          <Button type="button" size="sm" variant="secondary" className="ml-auto" onClick={desbloquear} disabled={pending}>
            Desbloquear para editar
          </Button>
        )}
      </div>

      {l.valor_centavos ? (
        <div className="mb-2">
          <div className="text-[44px] font-semibold leading-[1.05] tabular-nums">{formatBRL(l.valor_centavos)}</div>
          <div className="text-[15px] text-neutral-800">
            {fornecedorSalvo?.nome ?? l.fornecedor_nome ?? 'Fornecedor não informado'}
            {fornecedorSalvo?.documento ? ` · ${formatarDocumento(fornecedorSalvo.documento)}` : ''}
          </div>
        </div>
      ) : null}

      {bloqueado && !l.exportado && (
        <Alert tone="warning">Este lançamento está bloqueado para edição.</Alert>
      )}

      {sugeridos > 0 && !bloqueado && (
        <Alert tone="info">
          {sugeridos === 1 ? 'Um campo foi lido do arquivo e está marcado' : `${sugeridos} campos foram lidos do arquivo e estão marcados`} abaixo.
          Confira cada um antes de lançar; a leitura erra com alguma frequência em datas e valores.
        </Alert>
      )}

      {erro && <Alert tone="error">{erro}</Alert>}

      <fieldset disabled={bloqueado || pending} className="grid grid-cols-2 gap-4 disabled:opacity-70">
        <Field label="Fornecedor" htmlFor="fornecedor" error={fieldErrors.fornecedor_id} sugestao={sug(fornecedorId)} className="col-span-2">
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
            <Input id="numero" value={numero.valor} onChange={(e) => set(setNumero)(e.target.value)} data-sugestao={sug(numero) || undefined} inputMode="numeric" className="tabular-nums" />
          </Field>
          <Field label="Série" htmlFor="serie" error={fieldErrors.serie_nota} sugestao={sug(serie)}>
            <Input id="serie" value={serie.valor} onChange={(e) => set(setSerie)(e.target.value)} data-sugestao={sug(serie) || undefined} className="tabular-nums" />
          </Field>
        </div>

        <Field label="Data da nota" htmlFor="data" error={fieldErrors.data_nota} sugestao={sug(data)}>
          <Input id="data" value={data.valor} onChange={(e) => set(setData)(e.target.value)} placeholder="dd/mm/aaaa" inputMode="numeric" data-sugestao={sug(data) || undefined} className="tabular-nums" />
        </Field>

        <Field label="Valor (R$)" htmlFor="valor" error={fieldErrors.valor_centavos} sugestao={sug(valor)}>
          <Input id="valor" value={valor.valor} onChange={(e) => set(setValor)(e.target.value)} placeholder="0,00" inputMode="decimal" className="text-right tabular-nums" data-sugestao={sug(valor) || undefined} />
        </Field>

        <Field label="Conta bancária" htmlFor="conta" error={fieldErrors.conta_bancaria_id}>
          <Select id="conta" value={contaId.valor} onChange={(e) => set(setContaId)(e.target.value)}>
            <option value="">Não informada</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {!c.ativo ? ' (inativa)' : ''}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Descrição do item" htmlFor="descricao" error={fieldErrors.descricao} className="col-span-2">
          <Textarea id="descricao" value={descricao.valor} onChange={(e) => set(setDescricao)(e.target.value)} rows={2} placeholder="O que foi comprado ou contratado" />
        </Field>
      </fieldset>

      <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-divider pt-4">
        <Button type="submit" size="lg" loading={pending} disabled={bloqueado} title="Ctrl+Enter">
          {fila ? 'Lançar e ir para o próximo' : l.revisado_em ? 'Salvar' : 'Lançar'}
        </Button>
        {!l.revisado_em && (
          <Button type="button" size="lg" variant="secondary" disabled={pending || bloqueado} onClick={() => submeter(false)}>
            Salvar sem lançar
          </Button>
        )}
        {fila && (
          <Button type="button" size="lg" variant="ghost" disabled={pending} onClick={pular}>
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

      <p className="text-[13px] leading-relaxed text-neutral-700">
        <kbd>Ctrl</kbd>+<kbd>Enter</kbd> lança. Nenhum campo é obrigatório; o que faltar aparece como pendência.
        {l.valor_centavos ? ` · Valor salvo: ${formatBRL(l.valor_centavos)}` : ''}
      </p>
    </form>
  );
}
