/**
 * O PostgREST pode recusar temporariamente um token válido quando o relógio
 * usado para validá-lo está atrasado (PGRST303, "JWT issued at future").
 * Repete somente essa recusa, com espera crescente e limite de 3 retentativas.
 * A recusa acontece na autenticação, antes de qualquer operação no banco.
 * Outros erros (token expirado, permissão, rede etc.) seguem para o chamador.
 */
const ESPERAS_MS = [1500, 3000, 6000] as const;

export const fetchComRetentativa: typeof fetch = async (input, init) => {
  const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);

  for (let tentativa = 0; ; tentativa++) {
    // Um Request pode conter um body consumível: cada tentativa usa sua própria cópia.
    const res = await fetch(input instanceof Request ? input.clone() : input, init);
    if ((res.status !== 401 && res.status !== 403) || tentativa === ESPERAS_MS.length) return res;

    try {
      // A cópia preserva o corpo da resposta para o SDK processar normalmente.
      const erro: { code?: string; message?: string } = await res.clone().json();
      if (erro.code !== 'PGRST303' || erro.message !== 'JWT issued at future') return res;
    } catch {
      return res;
    }

    await esperar(ESPERAS_MS[tentativa], signal);
  }
};

/** Respeita o cancelamento da requisição também durante o intervalo entre tentativas. */
function esperar(ms: number, signal?: AbortSignal | null): Promise<void> {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', cancelar);
      resolve();
    }, ms);
    const cancelar = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener('abort', cancelar, { once: true });
  });
}
