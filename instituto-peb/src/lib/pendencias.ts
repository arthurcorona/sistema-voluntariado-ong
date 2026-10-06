import type { LancamentoView } from '@/types/aliases';

type CamposPendencia = Pick<
  LancamentoView,
  'fornecedor_id' | 'data_nota' | 'valor_centavos' | 'numero_nota' | 'descricao' | 'conta_bancaria_id' | 'revisado_em'
>;

/** Campos que faltam para completar a nota. Regra pura compartilhada entre servidor e navegador. */
export function pendenciasDe(l: CamposPendencia): string[] {
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
