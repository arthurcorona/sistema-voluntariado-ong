import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Logout por formulário simples (funciona sem JavaScript). */
export async function POST(request: NextRequest) {
  const db = await createClient();
  await db.auth.signOut();
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url, { status: 303 });
}
