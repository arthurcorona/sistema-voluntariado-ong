import { DbError } from '@/lib/db-errors';
import type { RegistrarUploadInput } from '@/lib/validation/anexos';
import * as anexosRepo from '@/repositories/anexos';
import * as lancamentosRepo from '@/repositories/lancamentos';
import * as storage from '@/repositories/storage';
import { extrair, type DadosExtraidos } from '@/services/extracao';
import type { Anexo, DbClient } from '@/types/aliases';

export type Duplicidade = { duplicado: false } | { duplicado: true; lancamentoId: string; anexoId: string };

export type RegistroUpload = {
  lancamentoId: string;
  anexoId: string;
  /** Verdadeiro quando o arquivo foi juntado a um lançamento pendente com a mesma chave de acesso. */
  agrupado: boolean;
  temSugestoes: boolean;
};

/** Pré-checagem antes de gastar banda com o upload (RF015). */
export async function verificarDuplicado(db: DbClient, hash: string): Promise<Duplicidade> {
  const existente = await anexosRepo.obterPorHash(db, hash);
  if (!existente) return { duplicado: false };
  return { duplicado: true, lancamentoId: existente.lancamento_id, anexoId: existente.id };
}

/**
 * Chamado depois que o navegador já subiu o arquivo para o Storage.
 * Lê o arquivo (XML/PDF), decide a que lançamento pertence e grava o anexo.
 * Em qualquer falha, o arquivo enviado é removido para não virar órfão.
 */
export async function registrarUpload(db: DbClient, input: RegistrarUploadInput): Promise<RegistroUpload | Duplicidade> {
  let dados: DadosExtraidos | null = null;
  try {
    const bytes = await storage.baixar(db, storage.BUCKET_ANEXOS, input.storagePath);
    dados = await extrair(input.mimeType, bytes);
  } catch {
    dados = null; // leitura é opcional; nunca bloqueia (RF023)
  }

  let lancamentoId = input.lancamentoId;
  let agrupado = false;
  let criouLancamento = false;

  if (!lancamentoId && dados?.chave) {
    const irmao = await anexosRepo.obterPendentePorChave(db, dados.chave);
    if (irmao) {
      lancamentoId = irmao.lancamento_id;
      agrupado = true;
    }
  }
  if (!lancamentoId) {
    lancamentoId = (await lancamentosRepo.criarVazio(db)).id;
    criouLancamento = true;
  }

  try {
    const anexo = await anexosRepo.criar(db, {
      lancamento_id: lancamentoId,
      storage_path: input.storagePath,
      nome_original: input.nomeOriginal,
      mime_type: input.mimeType,
      hash_sha256: input.hashSha256,
      tamanho_bytes: input.tamanhoBytes,
      dados_extraidos: dados ?? null,
    });
    return { lancamentoId, anexoId: anexo.id, agrupado, temSugestoes: dados !== null };
  } catch (e) {
    // Desfaz o que este upload criou.
    await storage.remover(db, storage.BUCKET_ANEXOS, [input.storagePath]).catch(() => undefined);
    if (criouLancamento) await lancamentosRepo.excluir(db, lancamentoId).catch(() => undefined);

    // Corrida: outro envio do mesmo arquivo chegou antes.
    if (e instanceof DbError && e.code === '23505') {
      const dup = await verificarDuplicado(db, input.hashSha256);
      if (dup.duplicado) return dup;
    }
    throw e;
  }
}

/** Remove o arquivo do lançamento e do Storage (RF018). */
export async function remover(db: DbClient, anexoId: string): Promise<void> {
  const anexo = await anexosRepo.obter(db, anexoId);
  if (!anexo) return;
  await anexosRepo.excluir(db, anexoId);
  await storage.remover(db, storage.BUCKET_ANEXOS, [anexo.storage_path]).catch(() => undefined);
}

export function listarPorLancamento(db: DbClient, lancamentoId: string): Promise<Anexo[]> {
  return anexosRepo.listarPorLancamento(db, lancamentoId);
}

/** URL assinada para abrir na tela (RF017, RNF022). */
export function urlDeVisualizacao(db: DbClient, anexo: Anexo): Promise<string> {
  return storage.urlAssinada(db, storage.BUCKET_ANEXOS, anexo.storage_path, { segundos: 600 });
}

export function dadosExtraidosDe(anexo: Anexo): DadosExtraidos | null {
  const d = anexo.dados_extraidos;
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  return d as DadosExtraidos;
}
