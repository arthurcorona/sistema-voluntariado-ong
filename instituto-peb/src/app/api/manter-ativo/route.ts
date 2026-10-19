import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Chamada diária pelo cron do Vercel (vercel.json) para o projeto Supabase
 * gratuito não pausar por inatividade. Complementa o workflow do GitHub.
 *
 * Protegida por CRON_SECRET: o Vercel envia "Authorization: Bearer <segredo>"
 * quando a variável existe no projeto. Sem a variável, a rota fica aberta,
 * o que é inofensivo (a consulta devolve lista vazia sem sessão).
 */
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (segredo && request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return new NextResponse('Não autorizado', { status: 401 });
  }

  const db = await createClient();
  const { error } = await db.from('contas_bancarias').select('id').limit(1);
  if (error) {
    return NextResponse.json({ ok: false, erro: error.message }, { status: 503 });
  }
  return NextResponse.json({ ok: true, em: new Date().toISOString() });
}
