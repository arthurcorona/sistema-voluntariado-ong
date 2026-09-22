import { check, unwrap } from '@/lib/db-errors';
import type { DbClient } from '@/types/aliases';

export const BUCKET_ANEXOS = 'anexos';
export const BUCKET_EXPORTACOES = 'exportacoes';

export { gerarCaminho, extensaoPorMime } from '@/lib/arquivos';

/** URL assinada de validade curta (RNF022). */
export async function urlAssinada(
  db: DbClient,
  bucket: string,
  path: string,
  opts: { segundos?: number; download?: string | boolean } = {},
): Promise<string> {
  const res = await db.storage
    .from(bucket)
    .createSignedUrl(path, opts.segundos ?? 300, opts.download ? { download: opts.download } : undefined);
  const data = unwrap(res, 'storage.urlAssinada');
  return data.signedUrl;
}

export async function baixar(db: DbClient, bucket: string, path: string): Promise<Uint8Array> {
  const res = await db.storage.from(bucket).download(path);
  const blob = unwrap(res, 'storage.baixar');
  return new Uint8Array(await blob.arrayBuffer());
}

export async function enviar(
  db: DbClient,
  bucket: string,
  path: string,
  body: Uint8Array | Blob | string,
  contentType: string,
): Promise<void> {
  const res = await db.storage.from(bucket).upload(path, body, { contentType, upsert: false });
  check(res, 'storage.enviar');
}

export async function remover(db: DbClient, bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const res = await db.storage.from(bucket).remove(paths);
  check(res, 'storage.remover');
}
