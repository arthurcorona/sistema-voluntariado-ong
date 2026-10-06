'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Tela de erro da área autenticada. Cobre falhas momentâneas de rede ou de
 * banco sem derrubar a navegação: a sidebar continua, e "Tentar de novo"
 * refaz a página.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-9">
      <div className="max-w-md text-center">
        <h1 className="text-[26px] font-semibold">Não foi possível carregar esta tela</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-800">
          Pode ter sido uma falha momentânea de conexão com o banco. Nada foi perdido. Tente de novo; se continuar, saia e entre outra vez.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="lg" onClick={reset}>
            Tentar de novo
          </Button>
          <form action="/api/sair" method="post">
            <Button type="submit" size="lg" variant="secondary">
              Sair
            </Button>
          </form>
        </div>
        {error.digest && <p className="mt-6 text-xs text-neutral-600">Código: {error.digest}</p>}
      </div>
    </div>
  );
}
