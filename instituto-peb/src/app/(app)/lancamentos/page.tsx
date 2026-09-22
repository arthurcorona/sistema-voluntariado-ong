import Link from 'next/link';
import { SITUACAO_LABEL } from '@/components/lancamentos/situacao-badge';
import { TabelaLancamentos } from '@/components/lancamentos/tabela-lancamentos';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/server';
import { filtrosLancamentosSchema, type FiltrosLancamentos } from '@/lib/validation/lancamentos';
import * as contasService from '@/services/contas-bancarias';
import * as lancamentos from '@/services/lancamentos';
import { SITUACOES } from '@/types/aliases';

type SP = Record<string, string | string[] | undefined>;

export default async function LancamentosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const bruto = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const parsed = filtrosLancamentosSchema.safeParse({
    ...bruto,
    situacao: bruto.situacao || undefined,
    de: bruto.de || undefined,
    ate: bruto.ate || undefined,
  });
  const filtros: FiltrosLancamentos = parsed.success ? parsed.data : { pagina: 1, conta: null };

  const db = await createClient();
  const [pagina, contas] = await Promise.all([lancamentos.listar(db, filtros), contasService.listar(db, { apenasAtivas: true })]);

  const linkPagina = (n: number) => {
    const p = new URLSearchParams();
    Object.entries(bruto).forEach(([k, v]) => v && k !== 'pagina' && k !== 'aviso' && p.set(k, v));
    p.set('pagina', String(n));
    return `/lancamentos?${p.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Lançamentos"
        description={`${pagina.total} registro(s)`}
        actions={
          <Link href="/envio">
            <Button variant="secondary">Enviar documentos</Button>
          </Link>
        }
      />

      {bruto.aviso === 'fila-concluida' && (
        <Alert tone="success" className="mb-4">
          Todos os documentos pendentes foram revisados.
        </Alert>
      )}
      {!parsed.success && (
        <Alert tone="error" className="mb-4">
          Filtros inválidos foram ignorados.
        </Alert>
      )}

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
          De
          <Input type="date" name="de" defaultValue={filtros.de ?? ''} className="h-9 w-40" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
          Até
          <Input type="date" name="ate" defaultValue={filtros.ate ?? ''} className="h-9 w-40" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
          Conta bancária
          <Select name="conta" defaultValue={filtros.conta ?? ''} className="h-9 w-52">
            <option value="">Todas</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
          Situação
          <Select name="situacao" defaultValue={filtros.situacao ?? ''} className="h-9 w-56">
            <option value="">Todas</option>
            {SITUACOES.map((s) => (
              <option key={s} value={s}>
                {SITUACAO_LABEL[s]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-zinc-600">
          Busca
          <Input type="search" name="q" defaultValue={filtros.q ?? ''} placeholder="Descrição, número ou fornecedor" className="h-9 min-w-56" />
        </label>
        <Button type="submit" size="sm" className="h-9">
          Filtrar
        </Button>
        <Link href="/lancamentos" className="h-9 px-2 text-sm leading-9 text-zinc-600 hover:underline">
          Limpar
        </Link>
      </form>

      <TabelaLancamentos linhas={pagina.linhas} contas={contas} />

      {pagina.paginas > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Paginação">
          <span className="text-zinc-600">
            Página {pagina.pagina} de {pagina.paginas}
          </span>
          <span className="flex gap-2">
            {pagina.pagina > 1 && (
              <Link href={linkPagina(pagina.pagina - 1)} className="text-blue-700 hover:underline">
                ← Anterior
              </Link>
            )}
            {pagina.pagina < pagina.paginas && (
              <Link href={linkPagina(pagina.pagina + 1)} className="text-blue-700 hover:underline">
                Próxima →
              </Link>
            )}
          </span>
        </nav>
      )}
    </div>
  );
}
