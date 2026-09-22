import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import type { Database } from '@/types/database';
import type { DbClient } from '@/types/aliases';

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Usa a sessão do operador logado; o RLS vale integralmente.
 *
 * Só repositórios (src/repositories) devem usar o cliente para dados.
 */
export async function createClient(): Promise<DbClient> {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado a partir de um Server Component: cookies são somente
          // leitura ali. O proxy (src/proxy.ts) cuida de renovar a sessão.
        }
      },
    },
  });
}

/** Id do operador autenticado, ou null. */
export async function currentUserId(db: DbClient): Promise<string | null> {
  const { data } = await db.auth.getUser();
  return data.user?.id ?? null;
}
