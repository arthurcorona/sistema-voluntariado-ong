import { unwrap, unwrapMaybe } from '@/lib/db-errors';
import type { DbClient, Fornecedor, FornecedorInsert, FornecedorUpdate } from '@/types/aliases';

export async function listar(
  db: DbClient,
  opts: { busca?: string; apenasAtivos?: boolean } = {},
): Promise<Fornecedor[]> {
  let q = db.from('fornecedores').select('*').order('nome');
  if (opts.apenasAtivos) q = q.eq('ativo', true);
  if (opts.busca) q = q.ilike('nome', `%${escapeLike(opts.busca)}%`);
  return unwrap(await q, 'fornecedores.listar');
}

export async function obter(db: DbClient, id: string): Promise<Fornecedor | null> {
  return unwrapMaybe(await db.from('fornecedores').select('*').eq('id', id).maybeSingle(), 'fornecedores.obter');
}

export async function obterPorDocumento(db: DbClient, documento: string): Promise<Fornecedor | null> {
  return unwrapMaybe(
    await db.from('fornecedores').select('*').eq('documento', documento).maybeSingle(),
    'fornecedores.obterPorDocumento',
  );
}

export async function criar(db: DbClient, dados: FornecedorInsert): Promise<Fornecedor> {
  return unwrap(await db.from('fornecedores').insert(dados).select().single(), 'fornecedores.criar');
}

export async function atualizar(db: DbClient, id: string, dados: FornecedorUpdate): Promise<Fornecedor> {
  return unwrap(
    await db.from('fornecedores').update(dados).eq('id', id).select().single(),
    'fornecedores.atualizar',
  );
}

export function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, (m) => `\\${m}`);
}
