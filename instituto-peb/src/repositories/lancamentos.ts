import { check, unwrap, unwrapMaybe } from '@/lib/db-errors';
import type { FiltrosLancamentos } from '@/lib/validation/lancamentos';
import type { DbClient, Lancamento, LancamentoUpdate, LancamentoView } from '@/types/aliases';

export const TAMANHO_PAGINA = 50;

export async function criarVazio(db: DbClient): Promise<Lancamento> {
  // criado_por vem do default auth.uid() no banco.
  return unwrap(await db.from('lancamentos').insert({ descricao: null }).select().single(), 'lancamentos.criarVazio');
}

export async function obter(db: DbClient, id: string): Promise<LancamentoView | null> {
  return unwrapMaybe(await db.from('vw_lancamentos').select('*').eq('id', id).maybeSingle(), 'lancamentos.obter');
}

export async function atualizar(db: DbClient, id: string, dados: LancamentoUpdate): Promise<Lancamento> {
  return unwrap(
    await db.from('lancamentos').update(dados).eq('id', id).select().single(),
    'lancamentos.atualizar',
  );
}

export async function excluir(db: DbClient, id: string): Promise<void> {
  check(await db.from('lancamentos').delete().eq('id', id), 'lancamentos.excluir');
}

/** Próximo lançamento pendente de revisão, na ordem de chegada, depois do atual. */
export async function proximoPendente(db: DbClient, aposId?: string): Promise<string | null> {
  let q = db
    .from('lancamentos')
    .select('id, criado_em')
    .is('revisado_em', null)
    .order('criado_em', { ascending: true })
    .limit(1);
  if (aposId) {
    const atual = unwrapMaybe<Pick<Lancamento, 'criado_em'>>(
      await db.from('lancamentos').select('criado_em').eq('id', aposId).maybeSingle(),
      'lancamentos.proximoPendente.atual',
    );
    if (atual) q = q.gt('criado_em', atual.criado_em).neq('id', aposId);
  }
  const rows = unwrap(await q, 'lancamentos.proximoPendente');
  return rows[0]?.id ?? null;
}

export async function contarPendentes(db: DbClient): Promise<number> {
  const res = await db.from('lancamentos').select('id', { count: 'exact', head: true }).is('revisado_em', null);
  check(res, 'lancamentos.contarPendentes');
  return res.count ?? 0;
}

export type PaginaLancamentos = { linhas: LancamentoView[]; total: number; pagina: number; paginas: number };

export async function listar(db: DbClient, f: FiltrosLancamentos): Promise<PaginaLancamentos> {
  let q = db.from('vw_lancamentos').select('*', { count: 'exact' });

  if (f.de) q = q.gte('data_nota', f.de);
  if (f.ate) q = q.lte('data_nota', f.ate);
  if (f.conta) q = q.eq('conta_bancaria_id', f.conta);
  if (f.situacao) q = q.eq('situacao', f.situacao);
  if (f.q) {
    // PostgREST usa vírgula e parênteses como sintaxe no .or(); tiramos do termo.
    const termo = f.q.replace(/[,()]/g, ' ').trim();
    if (termo) {
      const like = `%${termo}%`;
      q = q.or(`descricao.ilike.${like},numero_nota.ilike.${like},fornecedor_nome.ilike.${like}`);
    }
  }

  const from = (f.pagina - 1) * TAMANHO_PAGINA;
  q = q
    .order('data_nota', { ascending: false, nullsFirst: true })
    .order('criado_em', { ascending: false })
    .range(from, from + TAMANHO_PAGINA - 1);

  const res = await q;
  const linhas = unwrap(res, 'lancamentos.listar');
  const total = res.count ?? 0;
  return { linhas, total, pagina: f.pagina, paginas: Math.max(1, Math.ceil(total / TAMANHO_PAGINA)) };
}

/** Lançamentos exportáveis com data no período (para prévia e geração). */
export async function listarExportaveis(db: DbClient, de: string, ate: string): Promise<LancamentoView[]> {
  return unwrap(
    await db
      .from('vw_lancamentos')
      .select('*')
      .eq('exportavel', true)
      .gte('data_nota', de)
      .lte('data_nota', ate)
      .order('data_nota', { ascending: true })
      .order('fornecedor_nome', { ascending: true }),
    'lancamentos.listarExportaveis',
  );
}

/** Quantos lançamentos com data no período NÃO estão aptos (RF064). */
export async function contarNaoExportaveisNoPeriodo(db: DbClient, de: string, ate: string): Promise<number> {
  const res = await db
    .from('vw_lancamentos')
    .select('id', { count: 'exact', head: true })
    .eq('exportavel', false)
    .gte('data_nota', de)
    .lte('data_nota', ate);
  check(res, 'lancamentos.contarNaoExportaveisNoPeriodo');
  return res.count ?? 0;
}

/** Linhas revisadas com data no período, para o painel. */
export async function listarResumoPeriodo(
  db: DbClient,
  de: string,
  ate: string,
): Promise<Pick<LancamentoView, 'valor_centavos' | 'situacao'>[]> {
  return unwrap(
    await db
      .from('vw_lancamentos')
      .select('valor_centavos, situacao')
      .not('revisado_em', 'is', null)
      .gte('data_nota', de)
      .lte('data_nota', ate),
    'lancamentos.listarResumoPeriodo',
  );
}

export async function listarPorIds(db: DbClient, ids: string[]): Promise<LancamentoView[]> {
  if (ids.length === 0) return [];
  return unwrap(await db.from('vw_lancamentos').select('*').in('id', ids), 'lancamentos.listarPorIds');
}

export async function atualizarEmLote(db: DbClient, ids: string[], dados: LancamentoUpdate): Promise<number> {
  const res = await db.from('lancamentos').update(dados).in('id', ids).eq('bloqueado', false).select('id');
  return unwrap(res, 'lancamentos.atualizarEmLote').length;
}

export async function excluirEmLote(db: DbClient, ids: string[]): Promise<number> {
  // Bloqueados (já exportados) ficam de fora; o FK restrict também impediria.
  const res = await db.from('lancamentos').delete().in('id', ids).eq('bloqueado', false).select('id');
  return unwrap(res, 'lancamentos.excluirEmLote').length;
}
