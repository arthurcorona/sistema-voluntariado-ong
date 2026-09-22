import { todayISO } from '@/lib/dates';
import * as contasRepo from '@/repositories/contas-bancarias';
import * as lancamentosRepo from '@/repositories/lancamentos';
import type { DbClient } from '@/types/aliases';

export type Resumo = {
  periodo: { de: string; ate: string };
  totalCentavos: number;
  lancados: number;
  incompletos: number;
  pendentesRevisao: number;
  semContas: boolean;
};

/** Números do mês corrente para a tela inicial (RF055). */
export async function resumo(db: DbClient): Promise<Resumo> {
  const hoje = todayISO();
  const de = `${hoje.slice(0, 7)}-01`;
  const [y, m] = hoje.split('-').map(Number);
  const ate = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);

  const [linhas, pendentesRevisao, totalContas] = await Promise.all([
    lancamentosRepo.listarResumoPeriodo(db, de, ate),
    lancamentosRepo.contarPendentes(db),
    contasRepo.contar(db),
  ]);

  return {
    periodo: { de, ate },
    totalCentavos: linhas.reduce((s, l) => s + (l.valor_centavos ?? 0), 0),
    lancados: linhas.length,
    incompletos: linhas.filter((l) => l.situacao !== 'completo').length,
    pendentesRevisao,
    semContas: totalContas === 0,
  };
}
