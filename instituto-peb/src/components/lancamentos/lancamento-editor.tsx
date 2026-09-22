'use client';

import { useState } from 'react';
import { LancamentoForm } from '@/components/lancamentos/lancamento-form';
import { Alert } from '@/components/ui/alert';
import type { LancamentoParaEdicao } from '@/services/lancamentos';

/**
 * Envolve o formulário. O formulário é remontado (key) sempre que o
 * lançamento muda no servidor, para refletir o estado salvo; a mensagem de
 * resultado fica aqui fora, para sobreviver à remontagem.
 */
export function LancamentoEditor({ dados, fila, id }: { dados: LancamentoParaEdicao; fila: boolean; id: string }) {
  const [mensagem, setMensagem] = useState<{ tone: 'success' | 'error'; texto: string } | null>(null);
  return (
    <div className="flex flex-col gap-3">
      {mensagem && <Alert tone={mensagem.tone}>{mensagem.texto}</Alert>}
      <LancamentoForm
        key={`${id}-${dados.lancamento.atualizado_em ?? ''}-${dados.lancamento.bloqueado ? 'b' : 'l'}`}
        dados={dados}
        fila={fila}
        onMensagem={setMensagem}
      />
    </div>
  );
}
