'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { alternarAtivoFornecedor, atualizarFornecedor, criarFornecedor } from '@/actions/fornecedores';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { FieldErrors } from '@/lib/action-result';
import { formatarDocumento } from '@/lib/documento';
import type { Fornecedor } from '@/types/aliases';

export function FornecedoresTab({ fornecedores, busca }: { fornecedores: Fornecedor[]; busca?: string }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function alternar(f: Fornecedor) {
    start(async () => {
      const r = await alternarAtivoFornecedor({ id: f.id, ativo: !f.ativo });
      if (!r.ok) setErro(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <FornecedorForm
        titulo="Novo fornecedor"
        onSubmit={async (dados) => criarFornecedor(dados)}
        onSaved={() => router.refresh()}
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      {fornecedores.length === 0 ? (
        <EmptyState title={busca ? 'Nenhum fornecedor encontrado.' : 'Nenhum fornecedor cadastrado.'}>
          Fornecedores também podem ser criados direto na tela do lançamento.
        </EmptyState>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr className="border-b border-zinc-200">
              <th className="py-2 pr-3">Nome</th>
              <th className="py-2 pr-3">CPF/CNPJ</th>
              <th className="py-2 pr-3">Situação</th>
              <th className="py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {fornecedores.map((f) =>
              editando === f.id ? (
                <tr key={f.id} className="border-b border-zinc-100 bg-zinc-50">
                  <td colSpan={4} className="py-3">
                    <FornecedorForm
                      titulo="Editar fornecedor"
                      inicial={f}
                      onSubmit={async (dados) => atualizarFornecedor({ id: f.id, ...dados })}
                      onSaved={() => {
                        setEditando(null);
                        router.refresh();
                      }}
                      onCancel={() => setEditando(null)}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={f.id} className="border-b border-zinc-100">
                  <td className="py-2 pr-3 font-medium text-zinc-900">{f.nome}</td>
                  <td className="py-2 pr-3 tabular-nums text-zinc-700">{formatarDocumento(f.documento) || '—'}</td>
                  <td className="py-2 pr-3">{f.ativo ? <Badge tone="green">Ativo</Badge> : <Badge>Inativo</Badge>}</td>
                  <td className="py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(f.id)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => alternar(f)}>
                      {f.ativo ? 'Inativar' : 'Reativar'}
                    </Button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

type FormResult = { ok: true; data: Fornecedor } | { ok: false; error: string; fieldErrors?: FieldErrors };

export function FornecedorForm({
  titulo,
  inicial,
  onSubmit,
  onSaved,
  onCancel,
  compacto,
}: {
  titulo: string;
  inicial?: Pick<Fornecedor, 'nome' | 'documento'> | { nome: string; documento: string | null };
  onSubmit: (dados: { nome: string; documento: string }) => Promise<FormResult>;
  onSaved: (f: Fornecedor) => void;
  onCancel?: () => void;
  /** Versão para popover dentro da tela de lançamento. */
  compacto?: boolean;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // Sem useTransition aqui de propósito: no modo compacto este formulário
  // vive dentro do formulário do lançamento, e uma transição assíncrona que
  // atualiza o estado do pai enquanto este componente é desmontado deixa o
  // pai preso em "pending" (botão Lançar desabilitado).
  const [pending, setPending] = useState(false);
  const [nome, setNome] = useState(inicial?.nome ?? '');
  const [documento, setDocumento] = useState(formatarDocumento(inicial?.documento));

  async function enviar() {
    if (pending) return;
    setErro(null);
    setFieldErrors({});
    setPending(true);
    try {
      const r = await onSubmit({ nome, documento });
      if (!r.ok) {
        setErro(r.fieldErrors ? null : r.error);
        setFieldErrors(r.fieldErrors ?? {});
        return;
      }
      if (!inicial) {
        setNome('');
        setDocumento('');
      }
      onSaved(r.data);
    } finally {
      setPending(false);
    }
  }

  const campos = (
    <>
      {!compacto && <p className="w-full text-sm font-medium text-zinc-700">{titulo}</p>}
      <Field label="Nome" htmlFor={`f-nome-${titulo}`} error={fieldErrors.nome} className={compacto ? '' : 'min-w-64 flex-1'}>
        <Input
          id={`f-nome-${titulo}`}
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          autoFocus={Boolean(inicial) || compacto}
          onKeyDown={compacto ? teclaEnter(enviar) : undefined}
        />
      </Field>
      <Field label="CPF ou CNPJ (opcional)" htmlFor={`f-doc-${titulo}`} error={fieldErrors.documento} className={compacto ? '' : 'w-56'}>
        <Input
          id={`f-doc-${titulo}`}
          name="documento"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
          placeholder="00.000.000/0000-00"
          onKeyDown={compacto ? teclaEnter(enviar) : undefined}
        />
      </Field>
      <div className="flex gap-2">
        <Button type={compacto ? 'button' : 'submit'} onClick={compacto ? () => void enviar() : undefined} loading={pending} size={compacto ? 'sm' : 'md'}>
          {inicial && !compacto ? 'Salvar' : 'Adicionar'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" size={compacto ? 'sm' : 'md'} onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
      {erro && (
        <div className="w-full">
          <Alert tone="error">{erro}</Alert>
        </div>
      )}
    </>
  );

  // Modo compacto vive DENTRO do formulário do lançamento: não pode ser <form>
  // (HTML proíbe form aninhado). Enter e o botão chamam enviar() direto.
  if (compacto) return <div className="flex flex-col gap-3">{campos}</div>;

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-3"
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
    >
      {campos}
    </form>
  );
}

function teclaEnter(fn: () => void) {
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      fn();
    }
  };
}
