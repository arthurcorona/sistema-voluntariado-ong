'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { alternarAtivoConta, atualizarConta, criarConta } from '@/actions/contas-bancarias';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { ActionResult, FieldErrors } from '@/lib/action-result';
import type { ContaBancaria } from '@/types/aliases';

const TH = 'px-4 py-2.5 text-left text-[11px] font-normal uppercase tracking-[0.1em] text-neutral-700';

export function ContasTab({ contas, busca }: { contas: ContaBancaria[]; busca?: string }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function alternar(c: ContaBancaria) {
    start(async () => {
      const r = await alternarAtivoConta({ id: c.id, ativo: !c.ativo });
      if (!r.ok) setErro(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <ContaForm titulo="Nova conta bancária" onSubmit={criarConta} onSaved={() => router.refresh()} />
      {erro && <Alert tone="error">{erro}</Alert>}

      {contas.length === 0 ? (
        <EmptyState title={busca ? 'Nenhuma conta encontrada' : 'Nenhuma conta bancária cadastrada'}>
          Cadastre as contas com o nome que vocês usam no dia a dia, por exemplo &quot;Conta Projeto Educação&quot;.
        </EmptyState>
      ) : (
        <div className="overflow-auto rounded-md border border-divider bg-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider">
                <th className={TH}>Nome</th>
                <th className={TH}>Banco</th>
                <th className={TH}>Número</th>
                <th className={TH}>Situação</th>
                <th className={`${TH} text-right`}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contas.map((c) =>
                editando === c.id ? (
                  <tr key={c.id} className="border-b border-divider last:border-b-0">
                    <td colSpan={5} className="p-3">
                      <ContaForm
                        titulo="Editar conta"
                        inicial={c}
                        onSubmit={(dados) => atualizarConta({ id: c.id, ...dados })}
                        onSaved={() => {
                          setEditando(null);
                          router.refresh();
                        }}
                        onCancel={() => setEditando(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className="border-b border-divider last:border-b-0 hover:bg-ink/4">
                    <td className="px-4 py-3 text-[15px]">{c.nome}</td>
                    <td className="px-4 py-3 text-neutral-800">{c.banco ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums text-neutral-800">{c.numero ?? '—'}</td>
                    <td className="px-4 py-3">{c.ativo ? <Badge tone="accent">Ativa</Badge> : <Badge tone="muted">Inativa</Badge>}</td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditando(c.id)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" disabled={pending} onClick={() => alternar(c)}>
                        {c.ativo ? 'Inativar' : 'Reativar'}
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

function ContaForm({
  titulo,
  inicial,
  onSubmit,
  onSaved,
  onCancel,
}: {
  titulo: string;
  inicial?: ContaBancaria;
  onSubmit: (dados: { nome: string; banco: string; numero: string }) => Promise<ActionResult<ContaBancaria>>;
  onSaved: (c: ContaBancaria) => void;
  onCancel?: () => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-md border border-divider bg-neutral-100 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const form = e.currentTarget;
        start(async () => {
          setErro(null);
          setFieldErrors({});
          const r = await onSubmit({
            nome: String(fd.get('nome') ?? ''),
            banco: String(fd.get('banco') ?? ''),
            numero: String(fd.get('numero') ?? ''),
          });
          if (!r.ok) {
            setErro(r.fieldErrors ? null : r.error);
            setFieldErrors(r.fieldErrors ?? {});
            return;
          }
          form.reset();
          onSaved(r.data);
        });
      }}
    >
      <p className="w-full text-[15px] font-semibold">{titulo}</p>
      <Field label="Nome de uso interno" htmlFor={`c-nome-${titulo}`} error={fieldErrors.nome} className="min-w-64 flex-1">
        <Input id={`c-nome-${titulo}`} name="nome" defaultValue={inicial?.nome ?? ''} required autoFocus={Boolean(inicial)} placeholder="Ex.: Conta Projeto Educação" />
      </Field>
      <Field label="Banco (opcional)" htmlFor={`c-banco-${titulo}`} error={fieldErrors.banco} className="w-48">
        <Input id={`c-banco-${titulo}`} name="banco" defaultValue={inicial?.banco ?? ''} />
      </Field>
      <Field label="Número (opcional)" htmlFor={`c-num-${titulo}`} error={fieldErrors.numero} className="w-40">
        <Input id={`c-num-${titulo}`} name="numero" defaultValue={inicial?.numero ?? ''} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          {inicial ? 'Salvar' : 'Adicionar'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
      {erro && (
        <div className="w-full">
          <Alert tone="error">{erro}</Alert>
        </div>
      )}
    </form>
  );
}
