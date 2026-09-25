import { Badge } from '@/components/ui/badge';
import type { Situacao } from '@/types/aliases';

export const SITUACAO_LABEL: Record<Situacao, string> = {
  pendente_revisao: 'Pendente de revisão',
  incompleto: 'Incompleto',
  exportavel: 'Com pendências',
  completo: 'Completo',
};

const TONE: Record<Situacao, 'alert' | 'danger' | 'neutral' | 'accent'> = {
  pendente_revisao: 'alert',
  incompleto: 'danger',
  exportavel: 'neutral',
  completo: 'accent',
};

export function SituacaoBadge({ situacao }: { situacao: string | null }) {
  const s = (situacao ?? 'pendente_revisao') as Situacao;
  return <Badge tone={TONE[s] ?? 'neutral'}>{SITUACAO_LABEL[s] ?? situacao}</Badge>;
}
