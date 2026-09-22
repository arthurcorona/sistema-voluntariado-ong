/**
 * FORMATO DO ARQUIVO PARA O CONTADOR.
 *
 * Tudo que define o CSV mora aqui: colunas, ordem, separador, codificação,
 * quebra de linha e formatação de cada célula. O formato definitivo ainda
 * depende do arquivo de exemplo do escritório de contabilidade (Q1). Quando
 * ele chegar, só este arquivo muda.
 *
 * Provisório: ponto e vírgula, UTF-8 com BOM, CRLF — abre certo no Excel pt-BR.
 */
import { formatDateBR } from '@/lib/dates';
import { formatarDocumento } from '@/lib/documento';
import { formatCentavos } from '@/lib/money';

export type LinhaCsv = {
  data_nota: string; // ISO
  fornecedor_nome: string;
  fornecedor_documento: string | null;
  numero_nota: string | null;
  serie_nota: string | null;
  descricao: string | null;
  conta_bancaria_nome: string | null;
  valor_centavos: number;
  /** Campos que faltam (RF062). Vazio = completo. */
  pendencias: string[];
  /** Nomes dos arquivos correspondentes no pacote (RF065). */
  arquivos: string[];
};

export const FORMATO = {
  separador: ';',
  bom: '﻿',
  quebraLinha: '\r\n',
  codificacao: 'utf-8',
  mimeType: 'text/csv',
} as const;

type Coluna = { cabecalho: string; valor: (l: LinhaCsv) => string };

export const COLUNAS: Coluna[] = [
  { cabecalho: 'Data', valor: (l) => formatDateBR(l.data_nota) },
  { cabecalho: 'Fornecedor', valor: (l) => l.fornecedor_nome },
  { cabecalho: 'CPF/CNPJ', valor: (l) => formatarDocumento(l.fornecedor_documento) },
  { cabecalho: 'Numero NF', valor: (l) => l.numero_nota ?? '' },
  { cabecalho: 'Serie', valor: (l) => l.serie_nota ?? '' },
  { cabecalho: 'Descricao', valor: (l) => l.descricao ?? '' },
  { cabecalho: 'Conta bancaria', valor: (l) => l.conta_bancaria_nome ?? '' },
  { cabecalho: 'Valor', valor: (l) => formatCentavos(l.valor_centavos) },
  { cabecalho: 'Pendencias', valor: (l) => l.pendencias.join(', ') },
  { cabecalho: 'Arquivos', valor: (l) => l.arquivos.join(' | ') },
];

export function gerarCsv(linhas: LinhaCsv[]): string {
  const cabecalho = COLUNAS.map((c) => escapar(c.cabecalho)).join(FORMATO.separador);
  const corpo = linhas.map((l) => COLUNAS.map((c) => escapar(c.valor(l))).join(FORMATO.separador));
  return FORMATO.bom + [cabecalho, ...corpo].join(FORMATO.quebraLinha) + FORMATO.quebraLinha;
}

/** Aspas quando a célula tem separador, aspas ou quebra de linha (RFC 4180). */
export function escapar(v: string): string {
  if (v === '') return '';
  if (/[";\r\n]/.test(v) || v.includes(FORMATO.separador)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
