import JSZip from 'jszip';
import type { Periodo } from '@/lib/validation/exportacoes';
import { extensaoPorMime } from '@/lib/arquivos';
import * as anexosRepo from '@/repositories/anexos';
import * as repo from '@/repositories/exportacoes';
import * as lancamentosRepo from '@/repositories/lancamentos';
import * as storage from '@/repositories/storage';
import { FORMATO, gerarCsv, type LinhaCsv } from '@/services/csv/formato-contador';
import { pendenciasDe } from '@/services/lancamentos';
import type { Anexo, DbClient, Exportacao, LancamentoView } from '@/types/aliases';

export type Previa = {
  linhas: LancamentoView[];
  totalCentavos: number;
  /** Com data no período mas não aptos (RF064). */
  foraPorIncompletos: number;
  /** Aptos que já saíram em exportação anterior (RF068: entram de novo, mas avisamos). */
  jaExportados: number;
};

export async function previa(db: DbClient, p: Periodo): Promise<Previa> {
  const [linhas, foraPorIncompletos] = await Promise.all([
    lancamentosRepo.listarExportaveis(db, p.de, p.ate),
    lancamentosRepo.contarNaoExportaveisNoPeriodo(db, p.de, p.ate),
  ]);
  ordenar(linhas);
  return {
    linhas,
    totalCentavos: linhas.reduce((s, l) => s + (l.valor_centavos ?? 0), 0),
    foraPorIncompletos,
    jaExportados: linhas.filter((l) => l.exportado).length,
  };
}

/** Gera o CSV, guarda no Storage e registra a exportação. Devolve o id. */
export async function gerar(db: DbClient, p: Periodo): Promise<string> {
  const linhas = await lancamentosRepo.listarExportaveis(db, p.de, p.ate);
  ordenar(linhas);
  if (linhas.length === 0) throw new Error('Nenhum lançamento apto no período.');

  const ids = linhas.map((l) => l.id).filter((id): id is string => Boolean(id));
  const anexos = await anexosRepo.listarPorLancamentos(db, ids);
  const csv = gerarCsv(montarLinhas(linhas, anexos));

  const path = storage.gerarCaminho('text/xml', crypto.randomUUID()).replace(/\.xml$/, '.csv');
  await storage.enviar(db, storage.BUCKET_EXPORTACOES, path, new Blob([csv], { type: FORMATO.mimeType }), FORMATO.mimeType);

  try {
    return await repo.registrar(db, { periodoInicio: p.de, periodoFim: p.ate, arquivoPath: path, lancamentoIds: ids });
  } catch (e) {
    await storage.remover(db, storage.BUCKET_EXPORTACOES, [path]).catch(() => undefined);
    throw e;
  }
}

export function listar(db: DbClient) {
  return repo.listar(db);
}

export function obter(db: DbClient, id: string) {
  return repo.obter(db, id);
}

export function nomeCsv(e: Exportacao): string {
  return `notas_${e.periodo_inicio}_a_${e.periodo_fim}.csv`;
}

export function nomeZip(e: Exportacao): string {
  return `notas_${e.periodo_inicio}_a_${e.periodo_fim}.zip`;
}

export function urlCsv(db: DbClient, e: Exportacao): Promise<string> {
  return storage.urlAssinada(db, storage.BUCKET_EXPORTACOES, e.arquivo_path, { segundos: 120, download: nomeCsv(e) });
}

/**
 * Monta o ZIP com o CSV e os documentos, nomes casando com a coluna
 * "Arquivos" (RF065). Em memória: adequado ao volume do Instituto.
 */
export async function montarZip(db: DbClient, e: Exportacao): Promise<Uint8Array> {
  const ids = await repo.listarIdsDeLancamentos(db, e.id);
  const linhas = await lancamentosRepo.listarPorIds(db, ids);
  ordenar(linhas);
  const anexos = await anexosRepo.listarPorLancamentos(db, ids);

  const zip = new JSZip();
  zip.file(nomeCsv(e), await storage.baixar(db, storage.BUCKET_EXPORTACOES, e.arquivo_path));

  const pasta = zip.folder('documentos')!;
  await Promise.all(
    linhas.flatMap((l, i) =>
      anexos
        .filter((a) => a.lancamento_id === l.id)
        .map(async (a, j) => {
          const bytes = await storage.baixar(db, storage.BUCKET_ANEXOS, a.storage_path);
          pasta.file(nomeArquivoAnexo(i + 1, j, l, a), bytes);
        }),
    ),
  );

  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

/** 001_papelaria-central_NF19.pdf · sufixo -2, -3 quando a nota tem vários arquivos. */
export function nomeArquivoAnexo(linha: number, indiceAnexo: number, l: LancamentoView, a: Anexo): string {
  const num = String(linha).padStart(3, '0');
  const forn = slug(l.fornecedor_nome ?? 'fornecedor');
  const nota = l.numero_nota ? `_NF${slug(l.numero_nota)}` : '';
  const sufixo = indiceAnexo > 0 ? `-${indiceAnexo + 1}` : '';
  const ext = extensaoPorMime(a.mime_type) ?? 'bin';
  return `${num}_${forn}${nota}${sufixo}.${ext}`;
}

function montarLinhas(linhas: LancamentoView[], anexos: Anexo[]): LinhaCsv[] {
  return linhas.map((l, i) => ({
    data_nota: l.data_nota ?? '',
    fornecedor_nome: l.fornecedor_nome ?? '',
    fornecedor_documento: l.fornecedor_documento,
    numero_nota: l.numero_nota,
    serie_nota: l.serie_nota,
    descricao: l.descricao,
    conta_bancaria_nome: l.conta_bancaria_nome,
    valor_centavos: l.valor_centavos ?? 0,
    pendencias: pendenciasDe(l),
    arquivos: anexos.filter((a) => a.lancamento_id === l.id).map((a, j) => nomeArquivoAnexo(i + 1, j, l, a)),
  }));
}

/** Ordem determinística: precisa ser a mesma no CSV e no ZIP. */
function ordenar(linhas: LancamentoView[]): void {
  linhas.sort(
    (a, b) =>
      (a.data_nota ?? '').localeCompare(b.data_nota ?? '') ||
      (a.fornecedor_nome ?? '').localeCompare(b.fornecedor_nome ?? '') ||
      (a.id ?? '').localeCompare(b.id ?? ''),
  );
}

function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 40) || 'sem-nome';
}
