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

const TH = 'px-4 py-2.5 text-left text-[11px] font-normal uppercase tracking-[0.1em] text-neutral-700';

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
    <div className="flex flex-col gap-5">
      <FornecedorForm
        titulo="Novo fornecedor"
        onSubmit={async (dados) => criarFornecedor(dados)}
        onSaved={() => router.refresh()}
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      {fornecedores.length === 0 ? (
        <EmptyState title={busca ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}>
          Fornecedores também podem ser criados direto na tela do lançamento.
        </EmptyState>
      ) : (
        <div className="overflow-auto rounded-md border border-divider bg-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider">
                <th className={TH}>Nome</th>
                <th className={TH}>CPF/CNPJ</th>
                <th className={TH}>Situação</th>
                <th className={`${TH} text-right`}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((f) =>
                editando === f.id ? (
                  <tr key={f.id} className="border-b border-divider last:border-b-0">
                    <td colSpan={4} className="p-3">
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
                  <tr key={f.id} className="border-b border-divider last:border-b-0 hover:bg-ink/4">
                    <td className="px-4 py-3 text-[15px]">{f.nome}</td>
                    <td className="px-4 py-3 tabular-nums text-neutral-800">{formatarDocumento(f.documento) || '—'}</td>
                    <td className="px-4 py-3">{f.ativo ? <Badge tone="accent">Ativo</Badge> : <Badge tone="muted">Inativo</Badge>}</td>
                    <td className="px-4 py-2 text-right">
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
        </div>
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
      {!compacto && <p className="w-full text-[15px] font-semibold">{titulo}</p>}
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
          className="tabular-nums"
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
      className="flex flex-wrap items-end gap-3 rounded-md border border-divider bg-neutral-100 p-4"
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
