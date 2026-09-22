'use server';

import { revalidatePath } from 'next/cache';
import { fail, invalid, ok, type ActionResult } from '@/lib/action-result';
import { createClient } from '@/lib/supabase/server';
import { contaBancariaSchema, contaBancariaUpdateSchema } from '@/lib/validation/contas-bancarias';
import { alternarAtivoSchema } from '@/lib/validation/fornecedores';
import * as service from '@/services/contas-bancarias';
import type { ContaBancaria } from '@/types/aliases';

export async function criarConta(input: unknown): Promise<ActionResult<ContaBancaria>> {
  const parsed = contaBancariaSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const db = await createClient();
    const data = await service.criar(db, parsed.data);
    revalidatePath('/cadastros');
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

export async function atualizarConta(input: unknown): Promise<ActionResult<ContaBancaria>> {
  const parsed = contaBancariaUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const db = await createClient();
    const { id, ...dados } = parsed.data;
    const data = await service.atualizar(db, id, dados);
    revalidatePath('/cadastros');
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

export async function alternarAtivoConta(input: unknown): Promise<ActionResult<ContaBancaria>> {
  const parsed = alternarAtivoSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const db = await createClient();
    const data = await service.alternarAtivo(db, parsed.data.id, parsed.data.ativo);
    revalidatePath('/cadastros');
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}
