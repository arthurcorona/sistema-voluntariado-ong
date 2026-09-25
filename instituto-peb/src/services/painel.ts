import { todayISO } from '@/lib/dates';
import * as contasRepo from '@/repositories/contas-bancarias';
import * as lancamentosRepo from '@/repositories/lancamentos';
import type { DbClient, LancamentoView } from '@/types/aliases';

export type Resumo = {
  periodo: { de: string; ate: string };
  totalCentavos: number;
  lancados: number;
  incompletos: number;
  pendentesRevisao: number;
  /** Centavos dos lançamentos pendentes/incompletos listados em `pendencias`. */
  pendencias: LancamentoView[];
  pendenciasTotal: number;
  semContas: boolean;
};

const LIMITE_PENDENCIAS = 8;

/** Números do mês corrente e o que falta para fechá-lo (RF055). */
export async function resumo(db: DbClient): Promise<Resumo> {
  const hoje = todayISO();
  const de = `${hoje.slice(0, 7)}-01`;
  const [y, m] = hoje.split('-').map(Number);
  const ate = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);

  const [linhas, pendentesRevisao, totalContas, pendencias] = await Promise.all([
    lancamentosRepo.listarResumoPeriodo(db, de, ate),
    lancamentosRepo.contarPendentes(db),
    contasRepo.contar(db),
    lancamentosRepo.listarPendencias(db, LIMITE_PENDENCIAS),
  ]);

  return {
    periodo: { de, ate },
    totalCentavos: linhas.reduce((s, l) => s + (l.valor_centavos ?? 0), 0),
    lancados: linhas.length,
    incompletos: linhas.filter((l) => l.situacao !== 'completo').length,
    pendentesRevisao,
    pendencias: pendencias.linhas,
    pendenciasTotal: pendencias.total,
    semContas: totalContas === 0,
  };
}

/** Texto curto do que falta em um lançamento, para a lista do painel. */
export function motivoPendencia(l: LancamentoView, pendencias: string[]): string {
  if (!l.revisado_em) return 'Aguardando conferência';
  if (pendencias.length === 0) return 'Completo';
  return `Sem ${pendencias.map((p) => p.toLowerCase()).join(', ')}`;
}
