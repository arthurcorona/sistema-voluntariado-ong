import * as repo from '@/repositories/fornecedores';
import type { FornecedorInput } from '@/lib/validation/fornecedores';
import type { DbClient, Fornecedor } from '@/types/aliases';

export function listar(db: DbClient, opts: { busca?: string; apenasAtivos?: boolean } = {}) {
  return repo.listar(db, opts);
}

export function criar(db: DbClient, input: FornecedorInput): Promise<Fornecedor> {
  return repo.criar(db, { nome: input.nome, documento: input.documento });
}

export function atualizar(db: DbClient, id: string, input: FornecedorInput): Promise<Fornecedor> {
  return repo.atualizar(db, id, { nome: input.nome, documento: input.documento });
}

/** Inativar em vez de excluir (RF044). Reativar é o mesmo caminho. */
export function alternarAtivo(db: DbClient, id: string, ativo: boolean): Promise<Fornecedor> {
  return repo.atualizar(db, id, { ativo });
}

/** Fornecedor com este CPF/CNPJ, se houver (RF024). */
export function obterPorDocumento(db: DbClient, documento: string): Promise<Fornecedor | null> {
  return repo.obterPorDocumento(db, documento);
}
