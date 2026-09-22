'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { removerAnexo } from '@/actions/anexos';
import { Uploader } from '@/components/envio/uploader';
import { Button } from '@/components/ui/button';
import { ehImagem, ehPdf, ehXml, formatarTamanho } from '@/lib/arquivos';
import { cn } from '@/lib/cn';
import { formatDateBR } from '@/lib/dates';
import { formatarDocumento } from '@/lib/documento';
import { formatBRL } from '@/lib/money';
import type { AnexoComUrl } from '@/services/lancamentos';

export function Visualizador({ lancamentoId, anexos, bloqueado }: { lancamentoId: string; anexos: AnexoComUrl[]; bloqueado: boolean }) {
  const router = useRouter();
  const [ativo, setAtivo] = useState(0);
  const [adicionando, setAdicionando] = useState(false);
  const [pending, start] = useTransition();
  const anexo = anexos[ativo] ?? anexos[0];

  function remover(id: string) {
    if (!confirm('Remover este arquivo do lançamento? O arquivo será apagado.')) return;
    start(async () => {
      const r = await removerAnexo({ id });
      if (r.ok) {
        setAtivo(0);
        router.refresh();
      } else alert(r.error);
    });
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        {anexos.map((a, i) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAtivo(i)}
            className={cn(
              'max-w-56 truncate rounded-md border px-2 py-1 text-xs',
              i === ativo ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
            )}
            title={a.nome_original}
          >
            {a.nome_original}
          </button>
        ))}
        {!bloqueado && (
          <Button size="sm" variant="ghost" onClick={() => setAdicionando((v) => !v)}>
            {adicionando ? 'Fechar' : '+ arquivo'}
          </Button>
        )}
      </div>

      {adicionando && (
        <Uploader
          compacto
          lancamentoId={lancamentoId}
          onConcluido={() => {
            setAdicionando(false);
            router.refresh();
          }}
        />
      )}

      {anexo ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
          <div className="flex min-h-0 flex-1 items-stretch justify-center">
            {ehPdf(anexo.mime_type) && <iframe title={anexo.nome_original} src={`${anexo.url}#toolbar=0&navpanes=0`} className="h-full w-full" />}
            {ehImagem(anexo.mime_type) && (
              <div className="h-full w-full overflow-auto p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={anexo.url} alt={anexo.nome_original} className="mx-auto max-w-full" />
              </div>
            )}
            {ehXml(anexo.mime_type) && <ResumoXml anexo={anexo} />}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600">
            <span className="truncate">
              {anexo.nome_original} · {formatarTamanho(anexo.tamanho_bytes)}
            </span>
            <span className="flex shrink-0 gap-3">
              <a href={anexo.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                Abrir em nova aba
              </a>
              {!bloqueado && (
                <button type="button" disabled={pending} onClick={() => remover(anexo.id)} className="text-red-700 hover:underline">
                  Remover
                </button>
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-500">
          Este lançamento não tem arquivo. Use &quot;+ arquivo&quot; para anexar.
        </div>
      )}
    </div>
  );
}

function ResumoXml({ anexo }: { anexo: AnexoComUrl }) {
  const d = anexo.dados;
  return (
    <div className="w-full overflow-auto p-4 text-sm">
      <p className="mb-3 font-medium text-zinc-800">XML de nota fiscal eletrônica</p>
      {d ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {d.nome_emitente && <Linha k="Emitente" v={d.nome_emitente} />}
          {d.cnpj_emitente && <Linha k="CNPJ/CPF" v={formatarDocumento(d.cnpj_emitente)} />}
          {d.numero && <Linha k="Número" v={d.numero + (d.serie ? ` · série ${d.serie}` : '')} />}
          {d.emissao && <Linha k="Emissão" v={formatDateBR(d.emissao)} />}
          {d.valor_centavos !== undefined && <Linha k="Valor total" v={formatBRL(d.valor_centavos)} />}
          {d.chave && <Linha k="Chave" v={d.chave} mono />}
        </dl>
      ) : (
        <p className="text-zinc-600">Não foi possível ler este XML como NF-e. Preencha os campos manualmente.</p>
      )}
    </div>
  );
}

function Linha({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <>
      <dt className="text-zinc-500">{k}</dt>
      <dd className={cn('text-zinc-900', mono && 'break-all font-mono text-xs')}>{v}</dd>
    </>
  );
}
