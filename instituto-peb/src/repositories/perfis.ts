import { unwrapMaybe } from '@/lib/db-errors';
import type { DbClient, Perfil } from '@/types/aliases';

/** Perfil do operador logado. Null se não existir ou estiver inativo (RLS). */
export async function obterPerfilAtual(db: DbClient): Promise<Perfil | null> {
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return null;
  const res = await db.from('perfis').select('*').eq('id', auth.user.id).maybeSingle();
  return unwrapMaybe(res, 'perfis.obterPerfilAtual');
}
