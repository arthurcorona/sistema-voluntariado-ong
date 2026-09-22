'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { gerarExportacao } from '@/actions/exportacoes';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function GerarBotoes({ de, ate, quantidade }: { de: string; ate: string; quantidade: number }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function gerar(formato: 'csv' | 'zip') {
    setErro(null);
    start(async () => {
      const r = await gerarExportacao({ de, ate });
      if (!r.ok) {
        setErro(r.error);
        return;
      }
      // Dispara o download num link temporário e leva ao histórico.
      const a = document.createElement('a');
      a.href = `/api/exportacoes/${r.data.id}/${formato}`;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      router.push('/exportacoes');
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {erro && <Alert tone="error">{erro}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => gerar('csv')} loading={pending} disabled={quantidade === 0}>
          Gerar CSV
        </Button>
        <Button variant="secondary" onClick={() => gerar('zip')} loading={pending} disabled={quantidade === 0}>
          Gerar ZIP com documentos
        </Button>
      </div>
      <p className="text-xs text-zinc-500">A exportação fica registrada no histórico e pode ser baixada de novo em qualquer formato.</p>
    </div>
  );
}
