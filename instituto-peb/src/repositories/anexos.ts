import { check, unwrap, unwrapMaybe } from '@/lib/db-errors';
import type { Anexo, AnexoInsert, DbClient } from '@/types/aliases';

export async function listarPorLancamento(db: DbClient, lancamentoId: string): Promise<Anexo[]> {
  return unwrap(
    await db.from('anexos').select('*').eq('lancamento_id', lancamentoId).order('criado_em'),
    'anexos.listarPorLancamento',
  );
}

export async function listarPorLancamentos(db: DbClient, ids: string[]): Promise<Anexo[]> {
  if (ids.length === 0) return [];
  return unwrap(
    await db.from('anexos').select('*').in('lancamento_id', ids).order('criado_em'),
    'anexos.listarPorLancamentos',
  );
}

export async function obter(db: DbClient, id: string): Promise<Anexo | null> {
  return unwrapMaybe(await db.from('anexos').select('*').eq('id', id).maybeSingle(), 'anexos.obter');
}

export async function obterPorHash(db: DbClient, hash: string): Promise<Anexo | null> {
  return unwrapMaybe(await db.from('anexos').select('*').eq('hash_sha256', hash).maybeSingle(), 'anexos.obterPorHash');
}

/**
 * Anexo cuja leitura automática achou esta chave de acesso e cujo
 * lançamento ainda está pendente de revisão. Usado para agrupar PDF e XML
 * da mesma nota no mesmo lançamento.
 */
export async function obterPendentePorChave(db: DbClient, chave: string): Promise<Anexo | null> {
  const rows = unwrap(
    await db
      .from('anexos')
      .select('*, lancamentos!inner(revisado_em)')
      .eq('dados_extraidos->>chave', chave)
      .is('lancamentos.revisado_em', null)
      .order('criado_em', { ascending: true })
      .limit(1),
    'anexos.obterPendentePorChave',
  );
  const row = rows[0];
  if (!row) return null;
  const { lancamentos: _ignored, ...anexo } = row;
  void _ignored;
  return anexo as Anexo;
}

export async function criar(db: DbClient, dados: AnexoInsert): Promise<Anexo> {
  return unwrap(await db.from('anexos').insert(dados).select().single(), 'anexos.criar');
}

export async function excluir(db: DbClient, id: string): Promise<void> {
  check(await db.from('anexos').delete().eq('id', id), 'anexos.excluir');
}
