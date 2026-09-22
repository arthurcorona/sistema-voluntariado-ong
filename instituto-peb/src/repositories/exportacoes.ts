import { unwrap, unwrapMaybe } from '@/lib/db-errors';
import type { DbClient, Exportacao } from '@/types/aliases';

export type ExportacaoComAutor = Exportacao & { autor_nome: string | null };

export async function listar(db: DbClient): Promise<ExportacaoComAutor[]> {
  const rows = unwrap(
    await db
      .from('exportacoes')
      .select('*, perfis!gerada_por(nome)')
      .order('gerada_em', { ascending: false }),
    'exportacoes.listar',
  );
  return rows.map(({ perfis, ...e }) => ({ ...e, autor_nome: perfis?.nome ?? null }));
}

export async function obter(db: DbClient, id: string): Promise<Exportacao | null> {
  return unwrapMaybe(await db.from('exportacoes').select('*').eq('id', id).maybeSingle(), 'exportacoes.obter');
}

export async function listarIdsDeLancamentos(db: DbClient, exportacaoId: string): Promise<string[]> {
  const rows = unwrap(
    await db.from('itens_exportacao').select('lancamento_id').eq('exportacao_id', exportacaoId),
    'exportacoes.listarIdsDeLancamentos',
  );
  return rows.map((r) => r.lancamento_id);
}

/** Exportações em que um lançamento aparece (RF056). */
export async function listarPorLancamento(db: DbClient, lancamentoId: string): Promise<Exportacao[]> {
  const rows = unwrap(
    await db
      .from('itens_exportacao')
      .select('exportacoes(*)')
      .eq('lancamento_id', lancamentoId),
    'exportacoes.listarPorLancamento',
  );
  return rows
    .map((r) => r.exportacoes)
    .filter((e): e is Exportacao => e !== null)
    .sort((a, b) => b.gerada_em.localeCompare(a.gerada_em));
}

/** Cria exportação + itens atomicamente (função no banco). Retorna o id. */
export async function registrar(
  db: DbClient,
  p: { periodoInicio: string; periodoFim: string; arquivoPath: string; lancamentoIds: string[] },
): Promise<string> {
  return unwrap(
    await db.rpc('registrar_exportacao', {
      p_periodo_inicio: p.periodoInicio,
      p_periodo_fim: p.periodoFim,
      p_arquivo_path: p.arquivoPath,
      p_lancamentos: p.lancamentoIds,
    }),
    'exportacoes.registrar',
  );
}
