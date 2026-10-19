import { Badge } from '@/components/ui/badge';

/**
 * Três estados na interface: Pendente (amarelo), Concluído (verde) e
 * Cancelado (vermelho). As situações finas do banco (pendente_revisao,
 * incompleto, exportavel) continuam valendo para filtros e exportação.
 */
export type SituacaoTela = 'pendente' | 'completo' | 'cancelado';

export const SITUACAO_TELA_LABEL: Record<SituacaoTela, string> = {
  pendente: 'Pendente',
  completo: 'Concluído',
  cancelado: 'Cancelado',
};

const TONE: Record<SituacaoTela, 'warning' | 'success' | 'danger'> = {
  pendente: 'warning',
  completo: 'success',
  cancelado: 'danger',
};

export function situacaoTela(situacao: string | null): SituacaoTela {
  if (situacao === 'cancelado') return 'cancelado';
  return situacao === 'completo' ? 'completo' : 'pendente';
}

export function SituacaoBadge({ situacao }: { situacao: string | null }) {
  const s = situacaoTela(situacao);
  return <Badge tone={TONE[s]}>{SITUACAO_TELA_LABEL[s]}</Badge>;
}
