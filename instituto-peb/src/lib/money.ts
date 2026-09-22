/**
 * Dinheiro é SEMPRE inteiro em centavos (RF034, RNF031).
 * Este módulo é a única fronteira entre centavos e texto.
 */

const formatterBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatterPlain = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 123456 → "R$ 1.234,56" */
export function formatBRL(centavos: number): string {
  assertCentavos(centavos);
  return formatterBRL.format(centavos / 100);
}

/** 123456 → "1.234,56" (sem símbolo; para campos de formulário e CSV) */
export function formatCentavos(centavos: number): string {
  assertCentavos(centavos);
  return formatterPlain.format(centavos / 100);
}

/**
 * Converte o que a pessoa digitou em centavos.
 *
 * Aceita "1.234,56", "1234,56", "1234.56", "R$ 1.234,56", "1234", "12,5".
 * Regra: o último separador (vírgula ou ponto) é decimal se for seguido de
 * 1 ou 2 dígitos. Os demais são de milhar e precisam separar grupos de
 * exatamente 3 dígitos ("1.234.567"); "1,2,3" é rejeitado.
 *
 * Retorna null quando não dá para interpretar. Zero e negativo retornam
 * o número mesmo; quem valida (Zod) decide se aceita.
 */
export function parseCentavos(input: string): number | null {
  const cleaned = input.replace(/[^\d,.\-]/g, '');
  if (cleaned === '' || cleaned === '-') return null;

  const negative = cleaned.startsWith('-');
  const body = cleaned.replace(/-/g, '');
  if (body === '' || !/^[\d,.]+$/.test(body)) return null;

  const lastSep = Math.max(body.lastIndexOf(','), body.lastIndexOf('.'));
  let reais: string;
  let centavos: string;

  if (lastSep === -1) {
    reais = body;
    centavos = '00';
  } else {
    const after = body.slice(lastSep + 1);
    if (after.length === 1 || after.length === 2) {
      reais = body.slice(0, lastSep);
      centavos = after.padEnd(2, '0');
    } else {
      // separador de milhar no fim, ex.: "1.234" → 1234 reais
      reais = body;
      centavos = '00';
    }
  }

  if (reais === '') reais = '0';
  // Sem separador, ou separadores de milhar em grupos de 3 dígitos.
  if (!/^\d+$/.test(reais) && !/^\d{1,3}([,.]\d{3})+$/.test(reais)) return null;
  reais = reais.replace(/[,.]/g, '');
  if (!/^\d{2}$/.test(centavos)) return null;

  const value = Number(reais) * 100 + Number(centavos);
  if (!Number.isSafeInteger(value)) return null;
  return negative ? -value : value;
}

function assertCentavos(value: number): void {
  if (!Number.isInteger(value)) {
    throw new TypeError(`Valor monetário precisa ser inteiro em centavos, recebido ${value}`);
  }
}
