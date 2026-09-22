import { describe, expect, it } from 'vitest';
import { formatBRL, formatCentavos, parseCentavos } from '@/lib/money';

describe('parseCentavos', () => {
  it.each([
    ['1.234,56', 123456],
    ['1234,56', 123456],
    ['1234.56', 123456],
    ['R$ 1.234,56', 123456],
    ['1234', 123400],
    ['1.234', 123400],
    ['12,5', 1250],
    ['0,99', 99],
    [',50', 50],
    ['1.234.567,89', 123456789],
    ['-10,00', -1000],
    ['0', 0],
  ])('interpreta %s como %i centavos', (input, expected) => {
    expect(parseCentavos(input)).toBe(expected);
  });

  it.each(['', 'abc', 'R$', '-', '1,2,3,4'])('devolve null para %s', (input) => {
    expect(parseCentavos(input)).toBeNull();
  });
});

describe('formatCentavos / formatBRL', () => {
  it('formata no padrão brasileiro', () => {
    expect(formatCentavos(123456)).toBe('1.234,56');
    expect(formatCentavos(5)).toBe('0,05');
    expect(formatBRL(123456).replace(/ /g, ' ')).toBe('R$ 1.234,56');
  });

  it('recusa não inteiro', () => {
    expect(() => formatCentavos(12.5)).toThrow(TypeError);
  });

  it('parse e format são inversos', () => {
    for (const v of [1, 99, 100, 123456, 100000000]) {
      expect(parseCentavos(formatCentavos(v))).toBe(v);
    }
  });
});
