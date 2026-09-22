'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { fail, invalid, ok, type ActionResult } from '@/lib/action-result';
import { createClient } from '@/lib/supabase/server';
import { uuid } from '@/lib/validation/comum';
import { atribuirContaSchema, idsSchema, lancamentoFormSchema } from '@/lib/validation/lancamentos';
import * as service from '@/services/lancamentos';

const idSchema = z.object({ id: uuid });

function revalidar(id?: string) {
  revalidatePath('/lancamentos');
  revalidatePath('/');
  if (id) revalidatePath(`/lancamentos/${id}`);
}

export async function salvarLancamento(input: unknown): Promise<ActionResult<{ proximoId: string | null }>> {
  const parsed = lancamentoFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const db = await createClient();
    const r = await service.salvar(db, parsed.data);
    revalidar(parsed.data.id);
    return ok(r);
  } catch (e) {
    return fail(e);
  }
}

export async function excluirLancamento(input: unknown): Promise<ActionResult<void>> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const db = await createClient();
    await service.excluir(db, parsed.data.id);
    revalidar();
    return ok(undefined);
  } catch (e) {
    return fail(e, e instanceof Error ? e.message : undefined);
  }
}

export async function desbloquearLancamento(input: unknown): Promise<ActionResult<void>> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const db = await createClient();
    await service.desbloquear(db, parsed.data.id);
    revalidar(parsed.data.id);
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}

export async function proximoPendente(input: unknown): Promise<ActionResult<{ id: string | null }>> {
  const parsed = z.object({ aposId: uuid.optional() }).safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const db = await createClient();
    return ok({ id: await service.proximoPendente(db, parsed.data.aposId) });
  } catch (e) {
    return fail(e);
  }
}

export async function atribuirContaEmLote(input: unknown): Promise<ActionResult<{ alterados: number }>> {
  const parsed = atribuirContaSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const db = await createClient();
    const alterados = await service.atribuirContaEmLote(db, parsed.data.ids, parsed.data.conta_bancaria_id);
    revalidar();
    return ok({ alterados });
  } catch (e) {
    return fail(e);
  }
}

export async function excluirEmLote(input: unknown): Promise<ActionResult<{ excluidos: number }>> {
  const parsed = idsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const db = await createClient();
    const excluidos = await service.excluirEmLote(db, parsed.data.ids);
    revalidar();
    return ok({ excluidos });
  } catch (e) {
    return fail(e);
  }
}
