'use server';

import { revalidatePath } from 'next/cache';
import { fail, invalid, ok, type ActionResult } from '@/lib/action-result';
import { createClient } from '@/lib/supabase/server';
import { anexoIdSchema, hashSha256, registrarUploadSchema } from '@/lib/validation/anexos';
import * as service from '@/services/anexos';

export async function verificarDuplicado(hash: unknown): Promise<ActionResult<service.Duplicidade>> {
  const parsed = hashSha256.safeParse(hash);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const db = await createClient();
    return ok(await service.verificarDuplicado(db, parsed.data));
  } catch (e) {
    return fail(e);
  }
}

export async function registrarUpload(input: unknown): Promise<ActionResult<service.RegistroUpload | service.Duplicidade>> {
  const parsed = registrarUploadSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const db = await createClient();
    const r = await service.registrarUpload(db, parsed.data);
    revalidatePath('/lancamentos');
    revalidatePath('/');
    return ok(r);
  } catch (e) {
    return fail(e, 'Não foi possível registrar o arquivo. Tente de novo.');
  }
}

export async function removerAnexo(input: unknown): Promise<ActionResult<void>> {
  const parsed = anexoIdSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const db = await createClient();
    await service.remover(db, parsed.data.id);
    revalidatePath('/lancamentos');
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}
