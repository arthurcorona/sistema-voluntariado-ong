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
    <div className="mt-6 flex flex-col gap-3 border-t border-divider pt-4">
      {erro && <Alert tone="error">{erro}</Alert>}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={() => gerar('zip')} loading={pending} disabled={quantidade === 0}>
          Gerar pacote (CSV + documentos)
        </Button>
        <Button size="lg" variant="secondary" onClick={() => gerar('csv')} loading={pending} disabled={quantidade === 0}>
          Gerar apenas o CSV
        </Button>
        <span className="ml-auto text-[13px] text-neutral-700">
          O pacote sai em .zip, com os documentos nomeados conforme as linhas do arquivo. Tudo fica no histórico para baixar de novo.
        </span>
      </div>
    </div>
  );
}
