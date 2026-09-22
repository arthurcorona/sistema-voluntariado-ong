import type { FiltrosLancamentos, LancamentoFormData } from '@/lib/validation/lancamentos';
import * as anexosRepo from '@/repositories/anexos';
import * as contasRepo from '@/repositories/contas-bancarias';
import * as exportacoesRepo from '@/repositories/exportacoes';
import * as fornecedoresRepo from '@/repositories/fornecedores';
import * as repo from '@/repositories/lancamentos';
import { dadosExtraidosDe, urlDeVisualizacao } from '@/services/anexos';
import type { DadosExtraidos } from '@/services/extracao';
import type { Anexo, ContaBancaria, DbClient, Exportacao, Fornecedor, LancamentoView } from '@/types/aliases';

/** Campos que faltam para o lançamento ficar completo (RF032, RF062). */
export function pendenciasDe(l: Pick<LancamentoView, 'fornecedor_id' | 'data_nota' | 'valor_centavos' | 'numero_nota' | 'descricao' | 'conta_bancaria_id' | 'revisado_em'>): string[] {
  const p: string[] = [];
  if (!l.revisado_em) p.push('Revisão');
  if (!l.fornecedor_id) p.push('Fornecedor');
  if (!l.data_nota) p.push('Data');
  if (!l.valor_centavos) p.push('Valor');
  if (!l.numero_nota?.trim()) p.push('Número da nota');
  if (!l.descricao?.trim()) p.push('Descrição');
  if (!l.conta_bancaria_id) p.push('Conta bancária');
  return p;
}

export type Sugestoes = {
  fornecedor_id?: string;
  /** Emitente lido do arquivo sem cadastro correspondente: oferecer criação (RF024). */
  novoFornecedor?: { nome: string; documento: string | null };
  numero_nota?: string;
  serie_nota?: string;
  data_nota?: string;
  valor_centavos?: number;
};

/**
 * Junta o que os anexos leram automaticamente, dando preferência ao XML
 * (exato) sobre o PDF (heurístico). Só sugere para campo ainda vazio e só
 * enquanto o lançamento está pendente de revisão (RF022).
 */
export function montarSugestoes(
  l: LancamentoView,
  anexos: Anexo[],
  fornecedorDoEmitente: Fornecedor | null,
): Sugestoes {
  if (l.revisado_em) return {};
  const dados = anexos
    .map(dadosExtraidosDe)
    .filter((d): d is DadosExtraidos => d !== null)
    .sort((a, b) => (a.fonte === 'xml' ? -1 : 0) - (b.fonte === 'xml' ? -1 : 0));
  if (dados.length === 0) return {};

  const pick = <K extends keyof DadosExtraidos>(k: K) => dados.find((d) => d[k] !== undefined)?.[k];
  const s: Sugestoes = {};

  if (!l.numero_nota && pick('numero')) s.numero_nota = pick('numero');
  if (!l.serie_nota && pick('serie')) s.serie_nota = pick('serie');
  if (!l.data_nota && pick('emissao')) s.data_nota = pick('emissao');
  if (!l.valor_centavos && pick('valor_centavos')) s.valor_centavos = pick('valor_centavos');

  if (!l.fornecedor_id) {
    const cnpj = pick('cnpj_emitente');
    if (fornecedorDoEmitente && fornecedorDoEmitente.ativo) {
      s.fornecedor_id = fornecedorDoEmitente.id;
    } else if (cnpj || pick('nome_emitente')) {
      s.novoFornecedor = { nome: pick('nome_emitente') ?? '', documento: cnpj ?? null };
    }
  }
  return s;
}

export type AnexoComUrl = Anexo & { url: string; dados: DadosExtraidos | null };

export type LancamentoParaEdicao = {
  lancamento: LancamentoView;
  anexos: AnexoComUrl[];
  sugestoes: Sugestoes;
  exportacoes: Exportacao[];
  fornecedores: Fornecedor[];
  contas: ContaBancaria[];
};

export async function carregarParaEdicao(db: DbClient, id: string): Promise<LancamentoParaEdicao | null> {
  const lancamento = await repo.obter(db, id);
  if (!lancamento) return null;

  const [anexos, exportacoes, fornecedores, contas] = await Promise.all([
    anexosRepo.listarPorLancamento(db, id),
    lancamento.exportado ? exportacoesRepo.listarPorLancamento(db, id) : Promise.resolve([]),
    fornecedoresRepo.listar(db, { apenasAtivos: true }),
    contasRepo.listar(db, { apenasAtivas: true }),
  ]);

  // Fornecedor/conta inativos ainda precisam aparecer se forem o valor salvo (RF045).
  if (lancamento.fornecedor_id && !fornecedores.some((f) => f.id === lancamento.fornecedor_id)) {
    const f = await fornecedoresRepo.obter(db, lancamento.fornecedor_id);
    if (f) fornecedores.push(f);
  }
  if (lancamento.conta_bancaria_id && !contas.some((c) => c.id === lancamento.conta_bancaria_id)) {
    const todas = await contasRepo.listar(db);
    const c = todas.find((x) => x.id === lancamento.conta_bancaria_id);
    if (c) contas.push(c);
  }

  const cnpj = anexos.map(dadosExtraidosDe).find((d) => d?.cnpj_emitente)?.cnpj_emitente;
  const fornecedorDoEmitente = cnpj ? await fornecedoresRepo.obterPorDocumento(db, cnpj) : null;

  const comUrl: AnexoComUrl[] = await Promise.all(
    anexos.map(async (a) => ({ ...a, url: await urlDeVisualizacao(db, a), dados: dadosExtraidosDe(a) })),
  );

  return {
    lancamento,
    anexos: comUrl,
    sugestoes: montarSugestoes(lancamento, anexos, fornecedorDoEmitente),
    exportacoes,
    fornecedores,
    contas,
  };
}

/**
 * Salva o formulário. `lancar` marca a revisão (revisado_em). Um lançamento
 * já exportado volta a ficar bloqueado ao salvar, encerrando o desbloqueio.
 */
export async function salvar(db: DbClient, d: LancamentoFormData): Promise<{ proximoId: string | null }> {
  const atual = await repo.obter(db, d.id);
  if (!atual) throw new Error('Lançamento não encontrado.');

  await repo.atualizar(db, d.id, {
    fornecedor_id: d.fornecedor_id,
    numero_nota: d.numero_nota,
    serie_nota: d.serie_nota,
    data_nota: d.data_nota,
    valor_centavos: d.valor_centavos,
    descricao: d.descricao,
    conta_bancaria_id: d.conta_bancaria_id,
    ...(d.lancar && !atual.revisado_em ? { revisado_em: new Date().toISOString() } : {}),
    ...(atual.exportado ? { bloqueado: true } : {}),
  });

  const proximoId = d.irParaProximo ? await repo.proximoPendente(db, d.id) : null;
  return { proximoId };
}

export function proximoPendente(db: DbClient, aposId?: string): Promise<string | null> {
  return repo.proximoPendente(db, aposId);
}

/** Exclusão só de lançamento nunca exportado (RF036, RNF033). */
export async function excluir(db: DbClient, id: string): Promise<void> {
  const atual = await repo.obter(db, id);
  if (!atual) return;
  if (atual.exportado) throw new Error('Este lançamento já foi exportado e não pode ser excluído.');
  const anexos = await anexosRepo.listarPorLancamento(db, id);
  await repo.excluir(db, id); // anexos caem em cascata no banco
  const { remover, BUCKET_ANEXOS } = await import('@/repositories/storage');
  await remover(db, BUCKET_ANEXOS, anexos.map((a) => a.storage_path)).catch(() => undefined);
}

/** Desbloqueio explícito para editar lançamento exportado (RF037). */
export function desbloquear(db: DbClient, id: string) {
  return repo.atualizar(db, id, { bloqueado: false });
}

export function listar(db: DbClient, filtros: FiltrosLancamentos) {
  return repo.listar(db, filtros);
}

export function atribuirContaEmLote(db: DbClient, ids: string[], contaId: string): Promise<number> {
  return repo.atualizarEmLote(db, ids, { conta_bancaria_id: contaId });
}

export async function excluirEmLote(db: DbClient, ids: string[]): Promise<number> {
  const anexos = await anexosRepo.listarPorLancamentos(db, ids);
  const excluidos = await repo.excluirEmLote(db, ids);
  if (excluidos > 0) {
    // Só remove arquivos de lançamentos que de fato saíram.
    const restantes = new Set((await repo.listarPorIds(db, ids)).map((l) => l.id));
    const paths = anexos.filter((a) => !restantes.has(a.lancamento_id)).map((a) => a.storage_path);
    const { remover, BUCKET_ANEXOS } = await import('@/repositories/storage');
    await remover(db, BUCKET_ANEXOS, paths).catch(() => undefined);
  }
  return excluidos;
}
