import * as repo from '@/repositories/contas-bancarias';
import type { ContaBancariaInput } from '@/lib/validation/contas-bancarias';
import type { ContaBancaria, DbClient } from '@/types/aliases';

export function listar(db: DbClient, opts: { busca?: string; apenasAtivas?: boolean } = {}) {
  return repo.listar(db, opts);
}

export function criar(db: DbClient, input: ContaBancariaInput): Promise<ContaBancaria> {
  return repo.criar(db, input);
}

export function atualizar(db: DbClient, id: string, input: ContaBancariaInput): Promise<ContaBancaria> {
  return repo.atualizar(db, id, input);
}

export function alternarAtivo(db: DbClient, id: string, ativo: boolean): Promise<ContaBancaria> {
  return repo.atualizar(db, id, { ativo });
}

/** Para a orientação de primeiro uso (RNF007). */
export function existeAlguma(db: DbClient): Promise<boolean> {
  return repo.contar(db).then((n) => n > 0);
}
