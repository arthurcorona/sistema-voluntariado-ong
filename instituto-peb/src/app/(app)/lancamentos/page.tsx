import Link from 'next/link';
import { TabelaLancamentos } from '@/components/lancamentos/tabela-lancamentos';
import { Alert } from '@/components/ui/alert';
import { Button, buttonClass } from '@/components/ui/button';
import { Page } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/server';
import { filtrosLancamentosSchema, type FiltrosLancamentos } from '@/lib/validation/lancamentos';
import * as contasService from '@/services/contas-bancarias';
import * as lancamentos from '@/services/lancamentos';

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
    <Page
      title="Lançamentos"
      subtitle={pagina.total === 1 ? '1 lançamento' : `${pagina.total} lançamentos`}
      actions={
        <Link href="/envio" className={buttonClass('secondary')}>
          Novo lançamento
        </Link>
      }
    >
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

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1">
          <Input type="search" name="q" defaultValue={filtros.q ?? ''} placeholder="Buscar por fornecedor, descrição ou número" aria-label="Buscar" />
        </div>
        <label className="flex items-center gap-2 text-[13px] text-neutral-700">
          De
          <span className="block w-40">
            <Input type="date" name="de" defaultValue={filtros.de ?? ''} />
          </span>
        </label>
        <label className="flex items-center gap-2 text-[13px] text-neutral-700">
          Até
          <span className="block w-40">
            <Input type="date" name="ate" defaultValue={filtros.ate ?? ''} />
          </span>
        </label>
        <div className="w-48">
          <Select name="conta" defaultValue={filtros.conta ?? ''} aria-label="Conta bancária">
            <option value="">Todas as contas</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-48">
          <Select
            name="situacao"
            defaultValue={filtros.situacao === 'completo' ? 'completo' : filtros.situacao ? 'pendente' : ''}
            aria-label="Situação"
          >
            <option value="">Todas as situações</option>
            <option value="pendente">Pendentes</option>
            <option value="completo">Completos</option>
          </Select>
        </div>
        <Button type="submit" size="md" variant="secondary">
          Filtrar
        </Button>
        <Link href="/lancamentos" className={buttonClass('ghost')}>
          Limpar
        </Link>
      </form>

      <TabelaLancamentos linhas={pagina.linhas} contas={contas} total={pagina.total} />

      {pagina.paginas > 1 && (
        <nav className="mt-4 flex items-center justify-between text-[13px] text-neutral-700" aria-label="Paginação">
          <span>
            Página {pagina.pagina} de {pagina.paginas}
          </span>
          <span className="flex gap-4">
            {pagina.pagina > 1 && (
              <Link href={linkPagina(pagina.pagina - 1)} className="text-accent-700 hover:underline">
                Anterior
              </Link>
            )}
            {pagina.pagina < pagina.paginas && (
              <Link href={linkPagina(pagina.pagina + 1)} className="text-accent-700 hover:underline">
                Próxima
              </Link>
            )}
          </span>
        </nav>
      )}
    </Page>
  );
}
