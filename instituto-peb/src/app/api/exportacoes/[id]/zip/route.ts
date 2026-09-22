import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as service from '@/services/exportacoes';

export const maxDuration = 60;

/** Pacote com CSV + documentos (RF065). Montado sob demanda. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await createClient();
  const { data } = await db.auth.getUser();
  if (!data.user) return new NextResponse('Não autenticado', { status: 401 });

  const exportacao = await service.obter(db, id);
  if (!exportacao) return new NextResponse('Exportação não encontrada', { status: 404 });

  try {
    const bytes = await service.montarZip(db, exportacao);
    return new NextResponse(new Blob([bytes as BlobPart]), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${service.nomeZip(exportacao)}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return new NextResponse('Não foi possível montar o pacote. Tente de novo ou baixe só o CSV.', { status: 500 });
  }
}
