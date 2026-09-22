import { z } from 'zod';
import { parseCentavos } from '@/lib/money';
import { isValidISODate, parseDateBR } from '@/lib/dates';

/** Texto opcional: "" e espaços viram null. */
export const textoOpcional = z
  .string()
  .trim()
  .max(500, 'Máximo de 500 caracteres.')
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null);

export const uuid = z.uuid('Identificador inválido.');

/** UUID opcional vindo de <select>: "" vira null. */
export const uuidOpcional = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null)
  .refine((v) => v === null || z.uuid().safeParse(v).success, 'Seleção inválida.');

/** Data digitada como DD/MM/AAAA ou já em ISO. "" vira null. */
export const dataOpcional = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === '') return null;
    if (isValidISODate(v)) return v;
    const iso = parseDateBR(v);
    if (!iso) {
      ctx.addIssue({ code: 'custom', message: 'Use o formato DD/MM/AAAA.' });
      return z.NEVER;
    }
    return iso;
  })
  .nullable()
  .optional()
  .transform((v) => v ?? null);

/** Data obrigatória (filtros e período de exportação). */
export const dataObrigatoria = z
  .string()
  .trim()
  .min(1, 'Informe a data.')
  .transform((v, ctx) => {
    if (isValidISODate(v)) return v;
    const iso = parseDateBR(v);
    if (!iso) {
      ctx.addIssue({ code: 'custom', message: 'Use o formato DD/MM/AAAA.' });
      return z.NEVER;
    }
    return iso;
  });

/** Valor em reais digitado ("1.234,56") ou já em centavos (número). "" vira null. */
export const valorCentavosOpcional = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    if (typeof v === 'number') {
      if (!Number.isInteger(v)) {
        ctx.addIssue({ code: 'custom', message: 'Valor precisa ser inteiro em centavos.' });
        return z.NEVER;
      }
      return v;
    }
    const t = v.trim();
    if (t === '') return null;
    const c = parseCentavos(t);
    if (c === null) {
      ctx.addIssue({ code: 'custom', message: 'Valor inválido. Ex.: 1.234,56' });
      return z.NEVER;
    }
    if (c <= 0) {
      ctx.addIssue({ code: 'custom', message: 'O valor precisa ser maior que zero.' });
      return z.NEVER;
    }
    return c;
  })
  .nullable()
  .optional()
  .transform((v) => v ?? null);
