import { MIME_PERMITIDOS, TAMANHO_MAXIMO_BYTES, type MimePermitido } from '@/types/aliases';

const EXT_POR_MIME: Record<MimePermitido, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/xml': 'xml',
  'text/xml': 'xml',
};

const MIME_POR_EXT: Record<string, MimePermitido> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  xml: 'text/xml',
};

/** AAAA/MM/{uuid}.{ext}. Nunca usa o nome original (RNF024). */
export function gerarCaminho(mimeType: MimePermitido, uuid: string, agora = new Date()): string {
  const y = agora.getUTCFullYear();
  const m = String(agora.getUTCMonth() + 1).padStart(2, '0');
  return `${y}/${m}/${uuid}.${EXT_POR_MIME[mimeType]}`;
}

export function extensaoPorMime(mimeType: string): string | undefined {
  return (EXT_POR_MIME as Record<string, string>)[mimeType];
}

/**
 * Descobre o MIME aceito de um arquivo. Navegadores às vezes mandam type
 * vazio (XML) ou "image/jpg"; caímos na extensão do nome.
 */
export function mimeAceito(fileType: string, fileName: string): MimePermitido | null {
  const t = fileType === 'image/jpg' ? 'image/jpeg' : fileType;
  if ((MIME_PERMITIDOS as readonly string[]).includes(t)) return t as MimePermitido;
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return MIME_POR_EXT[ext] ?? null;
}

export function validarArquivo(fileType: string, fileName: string, tamanho: number): { mime: MimePermitido } | { erro: string } {
  const mime = mimeAceito(fileType, fileName);
  if (!mime) return { erro: 'Formato não aceito. Envie PDF, JPG, PNG ou XML.' };
  if (tamanho <= 0) return { erro: 'Arquivo vazio.' };
  if (tamanho > TAMANHO_MAXIMO_BYTES) return { erro: `Arquivo maior que ${TAMANHO_MAXIMO_BYTES / 1024 / 1024} MB.` };
  return { mime };
}

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ehImagem(mime: string): boolean {
  return mime.startsWith('image/');
}
export function ehPdf(mime: string): boolean {
  return mime === 'application/pdf';
}
export function ehXml(mime: string): boolean {
  return mime === 'application/xml' || mime === 'text/xml';
}
