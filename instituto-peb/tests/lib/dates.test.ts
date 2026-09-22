import { describe, expect, it } from 'vitest';
import { formatDateBR, isValidISODate, parseDateBR } from '@/lib/dates';

describe('parseDateBR', () => {
  it('converte DD/MM/AAAA em ISO', () => {
    expect(parseDateBR('01/09/2026')).toBe('2026-09-01');
    expect(parseDateBR('1/9/2026')).toBe('2026-09-01');
    expect(parseDateBR(' 29/02/2024 ')).toBe('2024-02-29');
  });

  it('rejeita datas inexistentes ou mal formadas', () => {
    expect(parseDateBR('31/02/2026')).toBeNull();
    expect(parseDateBR('29/02/2026')).toBeNull();
    expect(parseDateBR('2026-09-01')).toBeNull();
    expect(parseDateBR('00/01/2026')).toBeNull();
    expect(parseDateBR('')).toBeNull();
  });
});

describe('formatDateBR', () => {
  it('converte ISO em DD/MM/AAAA', () => {
    expect(formatDateBR('2026-09-01')).toBe('01/09/2026');
  });
  it('recusa formato inválido', () => {
    expect(() => formatDateBR('01/09/2026')).toThrow(TypeError);
  });
});

describe('isValidISODate', () => {
  it('valida formato e existência', () => {
    expect(isValidISODate('2026-09-01')).toBe(true);
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2026-9-1')).toBe(false);
  });
});
