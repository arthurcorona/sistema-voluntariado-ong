import { Badge } from '@/components/ui/badge';
import type { Situacao } from '@/types/aliases';

export const SITUACAO_LABEL: Record<Situacao, string> = {
  pendente_revisao: 'Pendente de revisão',
  incompleto: 'Incompleto',
  exportavel: 'Exportável · com pendências',
  completo: 'Completo',
};

const TONE: Record<Situacao, 'amber' | 'red' | 'blue' | 'green'> = {
  pendente_revisao: 'amber',
  incompleto: 'red',
  exportavel: 'blue',
  completo: 'green',
};

export function SituacaoBadge({ situacao }: { situacao: string | null }) {
  const s = (situacao ?? 'pendente_revisao') as Situacao;
  return <Badge tone={TONE[s] ?? 'zinc'}>{SITUACAO_LABEL[s] ?? situacao}</Badge>;
}
