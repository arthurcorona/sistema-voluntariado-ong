import type { ZodError } from 'zod';
import { friendlyDbMessage } from '@/lib/db-errors';

export type FieldErrors = Record<string, string>;

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(error: unknown, fallback?: string): ActionResult<T> {
  return { ok: false, error: friendlyDbMessage(error, fallback) };
}

/** Converte um ZodError em mensagens por campo, em português. */
export function invalid<T = never>(zodError: ZodError): ActionResult<T> {
  const fieldErrors: FieldErrors = {};
  for (const issue of zodError.issues) {
    const key = issue.path.join('.') || '_';
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    ok: false,
    error: 'Confira os campos destacados.',
    fieldErrors,
  };
}
