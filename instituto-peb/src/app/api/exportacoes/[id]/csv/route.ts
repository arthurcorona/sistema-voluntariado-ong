import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as service from '@/services/exportacoes';

/** Baixar de novo o CSV de uma exportação (RF067). Redireciona para URL assinada curta. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await createClient();
  const { data } = await db.auth.getUser();
  if (!data.user) return new NextResponse('Não autenticado', { status: 401 });

  const exportacao = await service.obter(db, id);
  if (!exportacao) return new NextResponse('Exportação não encontrada', { status: 404 });

  const url = await service.urlCsv(db, exportacao);
  return NextResponse.redirect(url, { status: 302 });
}
