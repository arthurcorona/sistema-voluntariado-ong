'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { removerAnexo } from '@/actions/anexos';
import { Uploader } from '@/components/envio/uploader';
import { Button } from '@/components/ui/button';
import { PdfCanvas } from '@/components/lancamentos/pdf-canvas';
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
    <div className="flex min-h-0 flex-col gap-3">
      {anexo ? (
        <>
          <div className="plate flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 items-stretch justify-center">
              {ehPdf(anexo.mime_type) && <PdfCanvas key={anexo.url} url={anexo.url} titulo={anexo.nome_original} />}
              {ehImagem(anexo.mime_type) && (
                <div className="h-full w-full overflow-auto p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={anexo.url} alt={anexo.nome_original} className="mx-auto max-w-full" />
                </div>
              )}
              {ehXml(anexo.mime_type) && <ResumoXml anexo={anexo} />}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-neutral-700">
            <span className="truncate tabular-nums">
              {anexo.nome_original} · {formatarTamanho(anexo.tamanho_bytes)}
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-1">
              <a href={anexo.url} target="_blank" rel="noreferrer" className="rounded-md px-2.5 py-1.5 font-semibold text-accent-700 hover:bg-accent-500/10">
                Abrir em nova aba
              </a>
              {!bloqueado && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remover(anexo.id)}
                  className="rounded-md px-2.5 py-1.5 font-semibold text-danger-800 hover:bg-danger-100 disabled:opacity-45"
                >
                  Remover
                </button>
              )}
            </span>
          </div>
        </>
      ) : (
        <div className="plate flex min-h-[280px] flex-1 items-center justify-center p-8 text-center text-sm text-neutral-700">
          Este lançamento não tem arquivo. Anexe um documento abaixo ou preencha os dados à mão.
        </div>
      )}

      <div className="shrink-0">
        <div className="kicker mb-2">Anexos vinculados</div>
        <div className="flex max-h-40 flex-col gap-1.5 overflow-auto">
          {anexos.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAtivo(i)}
              aria-pressed={i === ativo}
              className={cn(
                'flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm tabular-nums',
                i === ativo ? 'border-accent-500 bg-accent-100 text-accent-900' : 'border-divider hover:bg-neutral-200',
              )}
              title={a.nome_original}
            >
              <span className="truncate">{a.nome_original}</span>
              <span className="shrink-0 text-neutral-700">{formatarTamanho(a.tamanho_bytes)}</span>
            </button>
          ))}
          {!bloqueado && !adicionando && (
            <Button size="sm" variant="ghost" className="w-fit" onClick={() => setAdicionando(true)}>
              Adicionar arquivo
            </Button>
          )}
        </div>
        {adicionando && (
          <div className="mt-2">
            <Uploader
              compacto
              lancamentoId={lancamentoId}
              onConcluido={() => {
                setAdicionando(false);
                router.refresh();
              }}
            />
            <Button size="sm" variant="ghost" className="mt-1" onClick={() => setAdicionando(false)}>
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResumoXml({ anexo }: { anexo: AnexoComUrl }) {
  const d = anexo.dados;
  return (
    <div className="w-full overflow-auto p-5 text-sm">
      <p className="mb-3 text-[15px] font-semibold">XML de nota fiscal eletrônica</p>
      {d ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5">
          {d.nome_emitente && <Linha k="Emitente" v={d.nome_emitente} />}
          {d.cnpj_emitente && <Linha k="CNPJ/CPF" v={formatarDocumento(d.cnpj_emitente)} />}
          {d.numero && <Linha k="Número" v={d.numero + (d.serie ? ` · série ${d.serie}` : '')} />}
          {d.emissao && <Linha k="Emissão" v={formatDateBR(d.emissao)} />}
          {d.valor_centavos !== undefined && <Linha k="Valor total" v={formatBRL(d.valor_centavos)} />}
          {d.chave && <Linha k="Chave" v={d.chave} mono />}
        </dl>
      ) : (
        <p className="text-neutral-700">Não foi possível ler este XML como NF-e. Preencha os campos manualmente.</p>
      )}
    </div>
  );
}

function Linha({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <>
      <dt className="text-neutral-700">{k}</dt>
      <dd className={cn('text-ink', mono && 'break-all font-mono text-xs')}>{v}</dd>
    </>
  );
}
