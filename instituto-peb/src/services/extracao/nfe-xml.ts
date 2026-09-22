import { XMLParser } from 'fast-xml-parser';
import { decomporChave } from './chave-acesso';
import type { DadosExtraidos } from './tipos';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: false, // números ficam como texto: preserva zeros e decimais
  parseAttributeValue: false,
  trimValues: true,
});

type Obj = Record<string, unknown>;

/** Lê XML de NF-e/NFC-e (com ou sem nfeProc). Devolve null se não for NF-e. */
export function extrairDeXml(xml: string): DadosExtraidos | null {
  let raiz: unknown;
  try {
    raiz = parser.parse(xml);
  } catch {
    return null;
  }
  const infNFe = achar(raiz, ['nfeProc', 'NFe', 'infNFe']) ?? achar(raiz, ['NFe', 'infNFe']) ?? achar(raiz, ['infNFe']);
  if (!infNFe || typeof infNFe !== 'object') return null;

  const inf = infNFe as Obj;
  const ide = (inf.ide ?? {}) as Obj;
  const emit = (inf.emit ?? {}) as Obj;
  const tot = ((inf.total as Obj | undefined)?.ICMSTot ?? {}) as Obj;

  const dados: DadosExtraidos = { fonte: 'xml' };

  const id = texto(inf['@_Id']);
  const chave = id?.replace(/^NFe/i, '');
  if (chave && /^\d{44}$/.test(chave)) dados.chave = chave;

  const nNF = texto(ide.nNF);
  if (nNF) dados.numero = String(Number(nNF)) === 'NaN' ? nNF : String(Number(nNF));
  const serie = texto(ide.serie);
  if (serie) dados.serie = String(Number(serie)) === 'NaN' ? serie : String(Number(serie));

  const emissao = texto(ide.dhEmi) ?? texto(ide.dEmi);
  if (emissao && /^\d{4}-\d{2}-\d{2}/.test(emissao)) dados.emissao = emissao.slice(0, 10);

  const vNF = texto(tot.vNF);
  const centavos = vNF ? decimalParaCentavos(vNF) : null;
  if (centavos !== null && centavos > 0) dados.valor_centavos = centavos;

  const doc = texto(emit.CNPJ) ?? texto(emit.CPF);
  if (doc) dados.cnpj_emitente = doc.replace(/[.\-\/\s]/g, '').toUpperCase();
  const nome = texto(emit.xNome);
  if (nome) dados.nome_emitente = nome;

  // Se faltou algo, a chave completa o que der.
  if (dados.chave) {
    const dec = decomporChave(dados.chave);
    if (dec) {
      dados.numero ??= dec.numero;
      dados.serie ??= dec.serie;
      dados.cnpj_emitente ??= dec.cnpj;
    }
  }

  return dados;
}

/** "1234.56" → 123456. Aceita até 2 decimais; arredonda além disso. */
export function decimalParaCentavos(v: string): number | null {
  const m = /^(\d+)(?:\.(\d+))?$/.exec(v.trim());
  if (!m) return null;
  const inteiro = Number(m[1]);
  const frac = (m[2] ?? '').padEnd(2, '0');
  const centavos = inteiro * 100 + Number(frac.slice(0, 2));
  const resto = Number(frac.slice(2, 3) || '0');
  return centavos + (resto >= 5 ? 1 : 0);
}

function achar(obj: unknown, caminho: string[]): unknown {
  let atual: unknown = obj;
  for (const chave of caminho) {
    if (!atual || typeof atual !== 'object') return undefined;
    atual = (atual as Obj)[chave];
    if (Array.isArray(atual)) atual = atual[0];
  }
  return atual;
}

function texto(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'object') {
    // fast-xml-parser: tag com atributos vira { '#text': '...', '@_x': ... }
    const t = (v as Obj)['#text'];
    return t === undefined ? undefined : String(t);
  }
  const s = String(v).trim();
  return s === '' ? undefined : s;
}
