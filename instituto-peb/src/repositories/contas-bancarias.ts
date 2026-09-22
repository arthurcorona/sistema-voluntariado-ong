import { check, unwrap } from '@/lib/db-errors';
import { escapeLike } from './fornecedores';
import type { ContaBancaria, ContaBancariaInsert, ContaBancariaUpdate, DbClient } from '@/types/aliases';

export async function listar(
  db: DbClient,
  opts: { busca?: string; apenasAtivas?: boolean } = {},
): Promise<ContaBancaria[]> {
  let q = db.from('contas_bancarias').select('*').order('nome');
  if (opts.apenasAtivas) q = q.eq('ativo', true);
  if (opts.busca) q = q.ilike('nome', `%${escapeLike(opts.busca)}%`);
  return unwrap(await q, 'contas_bancarias.listar');
}

export async function contar(db: DbClient): Promise<number> {
  const res = await db.from('contas_bancarias').select('id', { count: 'exact', head: true });
  check(res, 'contas_bancarias.contar');
  return res.count ?? 0;
}

export async function criar(db: DbClient, dados: ContaBancariaInsert): Promise<ContaBancaria> {
  return unwrap(await db.from('contas_bancarias').insert(dados).select().single(), 'contas_bancarias.criar');
}

export async function atualizar(db: DbClient, id: string, dados: ContaBancariaUpdate): Promise<ContaBancaria> {
  return unwrap(
    await db.from('contas_bancarias').update(dados).eq('id', id).select().single(),
    'contas_bancarias.atualizar',
  );
}
