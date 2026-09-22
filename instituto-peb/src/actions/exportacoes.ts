'use server';

import { revalidatePath } from 'next/cache';
import { fail, invalid, ok, type ActionResult } from '@/lib/action-result';
import { createClient } from '@/lib/supabase/server';
import { periodoSchema } from '@/lib/validation/exportacoes';
import * as service from '@/services/exportacoes';

export async function gerarExportacao(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = periodoSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const db = await createClient();
    const id = await service.gerar(db, parsed.data);
    revalidatePath('/exportacoes');
    revalidatePath('/lancamentos');
    revalidatePath('/');
    return ok({ id });
  } catch (e) {
    return fail(e, e instanceof Error ? e.message : undefined);
  }
}
