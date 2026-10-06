import { Badge } from '@/components/ui/badge';
/** Dois estados na interface; as quatro situações do banco continuam valendo para a exportação. */
export type SituacaoTela = 'pendente' | 'completo';

export const SITUACAO_TELA_LABEL: Record<SituacaoTela, string> = {
  pendente: 'Pendente',
  completo: 'Completo',
};

export function situacaoTela(situacao: string | null): SituacaoTela {
  return situacao === 'completo' ? 'completo' : 'pendente';
}

export function SituacaoBadge({ situacao }: { situacao: string | null }) {
  const s = situacaoTela(situacao);
  return <Badge tone={s === 'completo' ? 'accent' : 'alert'}>{SITUACAO_TELA_LABEL[s]}</Badge>;
}
