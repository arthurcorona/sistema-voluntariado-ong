'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { registrarUpload, verificarDuplicado } from '@/actions/anexos';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatarTamanho, gerarCaminho, validarArquivo } from '@/lib/arquivos';
import { cn } from '@/lib/cn';
import { createClient } from '@/lib/supabase/client';
import type { MimePermitido } from '@/types/aliases';

type Status = 'aguardando' | 'verificando' | 'enviando' | 'registrando' | 'concluido' | 'duplicado' | 'erro';

type Item = {
  id: string;
  file: File;
  mime: MimePermitido | null;
  status: Status;
  mensagem?: string;
  lancamentoId?: string;
  agrupado?: boolean;
  temSugestoes?: boolean;
};

const CONCORRENCIA = 3;

const STATUS_LABEL: Record<Status, string> = {
  aguardando: 'Na fila',
  verificando: 'Verificando…',
  enviando: 'Enviando…',
  registrando: 'Lendo o documento…',
  concluido: 'Pronto',
  duplicado: 'Já enviado antes',
  erro: 'Falhou',
};

export function Uploader({
  lancamentoId,
  onConcluido,
  compacto,
}: {
  /** Quando informado, os arquivos são vinculados a este lançamento (RF016). */
  lancamentoId?: string;
  /** Chamado quando toda a fila termina (modo vinculado). */
  onConcluido?: () => void;
  compacto?: boolean;
}) {
  const router = useRouter();
  const [itens, setItens] = useState<Item[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const emAndamento = useRef(0);
  const fila = useRef<string[]>([]);
  // Hash e upload correm em paralelo; o registro no servidor é um por vez,
  // para que XML e PDF da mesma nota se encontrem e sejam agrupados.
  const registro = useRef<Promise<unknown>>(Promise.resolve());

  const atualizar = useCallback((id: string, patch: Partial<Item>) => {
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const processar = useCallback(
    async (item: Item) => {
      if (!item.mime) return;
      try {
        atualizar(item.id, { status: 'verificando', mensagem: undefined });
        const buffer = await item.file.arrayBuffer();
        const hash = hex(await crypto.subtle.digest('SHA-256', buffer));

        const dup = await verificarDuplicado(hash);
        if (!dup.ok) throw new Error(dup.error);
        if (dup.data.duplicado) {
          atualizar(item.id, { status: 'duplicado', lancamentoId: dup.data.lancamentoId });
          return;
        }

        atualizar(item.id, { status: 'enviando' });
        const path = gerarCaminho(item.mime, crypto.randomUUID());
        const supabase = createClient();
        const up = await supabase.storage.from('anexos').upload(path, item.file, { contentType: item.mime, upsert: false });
        if (up.error) throw new Error('Falha ao enviar o arquivo. Verifique a conexão e tente de novo.');

        atualizar(item.id, { status: 'registrando' });
        const dadosRegistro = {
          storagePath: path,
          nomeOriginal: item.file.name,
          mimeType: item.mime,
          hashSha256: hash,
          tamanhoBytes: item.file.size,
          lancamentoId: lancamentoId ?? null,
        };
        const vez = registro.current.then(() => registrarUpload(dadosRegistro));
        registro.current = vez.catch(() => undefined);
        const reg = await vez;
        if (!reg.ok) throw new Error(reg.error);
        if ('duplicado' in reg.data && reg.data.duplicado) {
          atualizar(item.id, { status: 'duplicado', lancamentoId: reg.data.lancamentoId });
          return;
        }
        if ('lancamentoId' in reg.data) {
          atualizar(item.id, {
            status: 'concluido',
            lancamentoId: reg.data.lancamentoId,
            agrupado: reg.data.agrupado,
            temSugestoes: reg.data.temSugestoes,
          });
        }
      } catch (e) {
        atualizar(item.id, { status: 'erro', mensagem: e instanceof Error ? e.message : 'Erro inesperado.' });
      }
    },
    [atualizar, lancamentoId],
  );

  // Motor da fila: mantém até CONCORRENCIA envios simultâneos (RNF011).
  useEffect(() => {
    const pendentes = itens.filter((i) => i.status === 'aguardando' && i.mime && !fila.current.includes(i.id));
    for (const item of pendentes) {
      if (emAndamento.current >= CONCORRENCIA) break;
      fila.current.push(item.id);
      emAndamento.current += 1;
      void processar(item).finally(() => {
        emAndamento.current -= 1;
        fila.current = fila.current.filter((x) => x !== item.id);
        // força nova passada do efeito
        setItens((prev) => [...prev]);
      });
    }
  }, [itens, processar]);

  const terminou = itens.length > 0 && itens.every((i) => ['concluido', 'duplicado', 'erro'].includes(i.status));
  const concluidos = itens.filter((i) => i.status === 'concluido');

  useEffect(() => {
    if (terminou && lancamentoId && onConcluido && concluidos.length > 0) onConcluido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminou]);

  function adicionar(files: FileList | File[]) {
    const novos: Item[] = Array.from(files).map((file) => {
      const v = validarArquivo(file.type, file.name, file.size);
      return 'erro' in v
        ? { id: crypto.randomUUID(), file, mime: null, status: 'erro', mensagem: v.erro }
        : { id: crypto.randomUUID(), file, mime: v.mime, status: 'aguardando' };
    });
    setItens((prev) => [...prev, ...novos]);
  }

  // Colar da área de transferência (RF012).
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files: File[] = [];
      for (const item of Array.from(e.clipboardData?.items ?? [])) {
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f) {
            const ext = f.type === 'image/png' ? 'png' : f.type === 'image/jpeg' ? 'jpg' : f.type === 'application/pdf' ? 'pdf' : '';
            const nome = f.name && f.name !== 'image.png' ? f.name : `colado-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
            files.push(new File([f], nome, { type: f.type }));
          }
        }
      }
      if (files.length) {
        e.preventDefault();
        adicionar(files);
      }
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  function tentarDeNovo(id: string) {
    atualizar(id, { status: 'aguardando', mensagem: undefined });
  }

  const primeiroNovo = concluidos.find((i) => !i.agrupado)?.lancamentoId ?? concluidos[0]?.lancamentoId;

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Área para arrastar arquivos ou clicar para escolher"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          adicionar(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors',
          compacto ? 'p-4' : 'p-10',
          arrastando ? 'border-blue-500 bg-blue-50' : 'border-zinc-300 bg-white hover:border-zinc-400',
        )}
      >
        <p className="font-medium text-zinc-800">{compacto ? 'Adicionar arquivo' : 'Arraste os arquivos aqui'}</p>
        <p className="mt-1 text-sm text-zinc-600">
          ou clique para escolher. Também dá para colar com <kbd className="rounded border px-1">Ctrl</kbd>+<kbd className="rounded border px-1">V</kbd>.
        </p>
        <p className="mt-2 text-xs text-zinc-500">PDF, JPG, PNG ou XML · até 25 MB cada · vários de uma vez</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.xml,application/pdf,image/jpeg,image/png,text/xml,application/xml"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) adicionar(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {itens.length > 0 && (
        <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
          {itens.map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate" title={i.file.name}>
                {i.file.name} <span className="text-zinc-400">· {formatarTamanho(i.file.size)}</span>
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-xs',
                  i.status === 'concluido' && 'text-green-700',
                  i.status === 'erro' && 'text-red-700',
                  i.status === 'duplicado' && 'text-amber-700',
                  !['concluido', 'erro', 'duplicado'].includes(i.status) && 'text-zinc-500',
                )}
              >
                {STATUS_LABEL[i.status]}
                {i.status === 'concluido' && i.agrupado && ' · juntado à mesma nota'}
                {i.status === 'concluido' && i.temSugestoes && !i.agrupado && ' · dados lidos'}
                {i.mensagem && `: ${i.mensagem}`}
              </span>
              {i.status === 'duplicado' && i.lancamentoId && (
                <Link href={`/lancamentos/${i.lancamentoId}`} className="text-xs text-blue-700 hover:underline">
                  abrir existente
                </Link>
              )}
              {i.status === 'erro' && i.mime && (
                <Button size="sm" variant="secondary" onClick={() => tentarDeNovo(i.id)}>
                  Tentar de novo
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {terminou && !lancamentoId && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-sm text-zinc-700">
            {concluidos.length} {concluidos.length === 1 ? 'documento registrado' : 'documentos registrados'}
            {itens.some((i) => i.status === 'duplicado') && ', alguns já existiam'}
            {itens.some((i) => i.status === 'erro') && ', alguns falharam'}.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setItens([])}>
              Enviar mais
            </Button>
            {primeiroNovo && (
              <Button onClick={() => router.push(`/lancamentos/${primeiroNovo}?fila=1`)}>
                Revisar lançamentos →
              </Button>
            )}
          </div>
        </div>
      )}

      {itens.some((i) => i.status === 'erro' && !i.mime) && (
        <Alert tone="warning">Alguns arquivos foram recusados por formato ou tamanho. Eles não serão enviados.</Alert>
      )}
    </div>
  );
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
