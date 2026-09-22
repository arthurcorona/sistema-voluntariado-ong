'use client';

import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Cliente Supabase para Client Components.
 * Uso restrito a autenticação e envio direto de arquivos ao Storage.
 * Leitura e escrita de dados passam por Server Actions → services → repositories.
 */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
