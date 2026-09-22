'use server';

import { revalidatePath } from 'next/cache';
import { fail, invalid, ok, type ActionResult } from '@/lib/action-result';
import { createClient } from '@/lib/supabase/server';
import { alternarAtivoSchema, fornecedorSchema, fornecedorUpdateSchema } from '@/lib/validation/fornecedores';
import * as service from '@/services/fornecedores';
import type { Fornecedor } from '@/types/aliases';

export async function criarFornecedor(input: unknown): Promise<ActionResult<Fornecedor>> {
  const parsed = fornecedorSchema.safeParse(input);
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

export async function atualizarFornecedor(input: unknown): Promise<ActionResult<Fornecedor>> {
  const parsed = fornecedorUpdateSchema.safeParse(input);
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

export async function alternarAtivoFornecedor(input: unknown): Promise<ActionResult<Fornecedor>> {
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

/** Lista de ativos para comboboxes (tela de lançamento). */
export async function listarFornecedoresAtivos(): Promise<ActionResult<Fornecedor[]>> {
  try {
    const db = await createClient();
    return ok(await service.listar(db, { apenasAtivos: true }));
  } catch (e) {
    return fail(e);
  }
}
