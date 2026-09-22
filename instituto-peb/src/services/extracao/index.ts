import { ehPdf, ehXml } from '@/lib/arquivos';
import { extrairDeDanfe } from './danfe-pdf';
import { extrairDeXml } from './nfe-xml';
import { temAlgumDado, type DadosExtraidos } from './tipos';

export type { DadosExtraidos } from './tipos';

/** Acima disso não tentamos ler: não vale o tempo de função. */
const LIMITE_LEITURA_BYTES = 15 * 1024 * 1024;

/**
 * Ponto único de entrada da leitura automática. NUNCA lança: falha de
 * leitura devolve null e o cadastro segue manual (RF023).
 */
export async function extrair(mimeType: string, bytes: Uint8Array): Promise<DadosExtraidos | null> {
  if (bytes.byteLength === 0 || bytes.byteLength > LIMITE_LEITURA_BYTES) return null;
  try {
    let dados: DadosExtraidos | null = null;
    if (ehXml(mimeType)) {
      dados = extrairDeXml(new TextDecoder('utf-8').decode(bytes));
    } else if (ehPdf(mimeType)) {
      dados = await extrairDeDanfe(bytes);
    }
    return temAlgumDado(dados) ? dados : null;
  } catch {
    return null;
  }
}
