'use client';

import { useEffect, useRef, useState } from 'react';

/** Desenha as páginas com o pdf.js do unpdf, sem depender do visualizador do navegador. */
export function PdfCanvas({ url, titulo }: { url: string; titulo: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando');
  const [paginas, setPaginas] = useState(0);

  useEffect(() => {
    const alvo = caixa.current;
    if (!alvo) return;
    const controller = new AbortController();
    let cancelado = false;
    let destruirPdf: (() => Promise<void>) | undefined;
    let renderizacao: { cancel: () => void } | undefined;
    alvo.replaceChildren();

    async function desenhar(alvo: HTMLDivElement) {
      try {
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const bytes = new Uint8Array(await resp.arrayBuffer());
        if (cancelado) return;
        // O pacote é carregado somente quando um anexo PDF precisa ser exibido.
        const { getDocumentProxy } = await import('unpdf');
        if (cancelado) return;
        const pdf = await getDocumentProxy(bytes);
        destruirPdf = () => pdf.loadingTask.destroy();
        if (cancelado) {
          await destruirPdf();
          return;
        }
        setPaginas(pdf.numPages);

        const largura = alvo.clientWidth || 600;
        const dpr = window.devicePixelRatio || 1;
        for (let n = 1; n <= pdf.numPages; n++) {
          const pagina = await pdf.getPage(n);
          if (cancelado) return;
          const escala = largura / pagina.getViewport({ scale: 1 }).width;
          const vp = pagina.getViewport({ scale: escala * dpr });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(vp.width);
          canvas.height = Math.floor(vp.height);
          canvas.style.width = `${Math.floor(vp.width / dpr)}px`;
          canvas.className = 'mx-auto mb-2 block max-w-full bg-white shadow-sm';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `${titulo}, página ${n} de ${pdf.numPages}`);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas indisponível');
          const tarefa = pagina.render({ canvasContext: ctx, viewport: vp, canvas });
          renderizacao = tarefa;
          await tarefa.promise;
          renderizacao = undefined;
          if (cancelado) return;
          alvo.appendChild(canvas);
          pagina.cleanup();
        }
        setEstado('ok');
      } catch {
        if (!cancelado) {
          alvo.replaceChildren();
          setEstado('erro');
        }
      }
    }
    void desenhar(alvo);

    return () => {
      // Ao trocar de anexo, interrompe download/desenho e libera os recursos do PDF antigo.
      cancelado = true;
      controller.abort();
      renderizacao?.cancel();
      void destruirPdf?.().catch(() => undefined);
    };
  }, [url, titulo]);

  return (
    <div className="h-full w-full overflow-auto p-2">
      {estado === 'carregando' && <p className="py-8 text-center text-sm text-neutral-700">Carregando documento…</p>}
      {estado === 'erro' && (
        <p className="py-8 text-center text-sm text-neutral-700" role="alert">
          Não foi possível exibir este PDF aqui. Use &quot;Abrir em nova aba&quot;, logo abaixo.
        </p>
      )}
      <div ref={caixa} aria-busy={estado === 'carregando'} />
      {estado === 'ok' && paginas > 1 && <p className="pb-2 text-center text-xs text-neutral-600">{paginas} páginas</p>}
    </div>
  );
}
