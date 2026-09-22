import { parseCentavos } from '@/lib/money';
import { parseDateBR } from '@/lib/dates';
import { decomporChave, encontrarChaveEmTexto } from './chave-acesso';
import type { DadosExtraidos } from './tipos';

/**
 * Lê o texto de um DANFE em PDF (com texto selecionável) e tenta achar a
 * chave de acesso. Dela saem CNPJ, número e série, com exatidão.
 * Valor e data são heurísticas sobre o texto e podem falhar: por isso
 * tudo é só sugestão (RF022).
 */
export async function extrairDeDanfe(bytes: Uint8Array): Promise<DadosExtraidos | null> {
  const { extractText } = await import('unpdf');
  const { text } = await extractText(bytes, { mergePages: true });
  return extrairDeTextoDanfe(text);
}

/** Separado da leitura do PDF para ser testável sem arquivo. */
export function extrairDeTextoDanfe(texto: string): DadosExtraidos | null {
  if (!texto || texto.trim() === '') return null;
  const chave = encontrarChaveEmTexto(texto);
  if (!chave) return null;

  const dados: DadosExtraidos = { fonte: 'pdf', chave };
  const dec = decomporChave(chave);
  if (dec) {
    dados.cnpj_emitente = dec.cnpj;
    dados.numero = dec.numero;
    dados.serie = dec.serie;
  }

  const plano = texto.replace(/\s+/g, ' ');

  const valor = /VALOR TOTAL DA NOTA[^0-9]{0,40}(\d{1,3}(?:\.\d{3})*,\d{2})/i.exec(plano);
  if (valor) {
    const c = parseCentavos(valor[1]);
    if (c && c > 0) dados.valor_centavos = c;
  }

  const data = /DATA (?:DE|DA) EMISS[ÃA]O[^0-9]{0,40}(\d{2}\/\d{2}\/\d{4})/i.exec(plano);
  if (data) {
    const iso = parseDateBR(data[1]);
    if (iso) dados.emissao = iso;
  }

  return dados;
}
