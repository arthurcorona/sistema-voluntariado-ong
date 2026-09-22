import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/types/database';

export type DbClient = SupabaseClient<Database>;

export type Perfil = Tables<'perfis'>;
export type Fornecedor = Tables<'fornecedores'>;
export type ContaBancaria = Tables<'contas_bancarias'>;
export type Lancamento = Tables<'lancamentos'>;
export type Anexo = Tables<'anexos'>;
export type Exportacao = Tables<'exportacoes'>;
export type ItemExportacao = Tables<'itens_exportacao'>;
export type LancamentoView = Tables<'vw_lancamentos'>;

export type FornecedorInsert = TablesInsert<'fornecedores'>;
export type FornecedorUpdate = TablesUpdate<'fornecedores'>;
export type ContaBancariaInsert = TablesInsert<'contas_bancarias'>;
export type ContaBancariaUpdate = TablesUpdate<'contas_bancarias'>;
export type LancamentoUpdate = TablesUpdate<'lancamentos'>;
export type AnexoInsert = TablesInsert<'anexos'>;

/** Valores possíveis de vw_lancamentos.situacao, em ordem crescente. */
export const SITUACOES = ['pendente_revisao', 'incompleto', 'exportavel', 'completo'] as const;
export type Situacao = (typeof SITUACOES)[number];

/** MIME types aceitos no envio; espelha o check em anexos e o bucket. */
export const MIME_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/xml',
  'text/xml',
] as const;
export type MimePermitido = (typeof MIME_PERMITIDOS)[number];

/** Limite do bucket "anexos" (25 MB). */
export const TAMANHO_MAXIMO_BYTES = 25 * 1024 * 1024;
