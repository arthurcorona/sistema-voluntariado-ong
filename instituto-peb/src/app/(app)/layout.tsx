import { redirect } from 'next/navigation';
import { IdleLogout } from '@/components/layout/idle-logout';
import { Sidebar } from '@/components/layout/sidebar';
import { createClient } from '@/lib/supabase/server';
import * as perfis from '@/repositories/perfis';
import * as lancamentos from '@/repositories/lancamentos';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const db = await createClient();
  const { data } = await db.auth.getUser();
  if (!data.user) redirect('/login');

  const perfil = await perfis.obterPerfilAtual(db);
  if (!perfil) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
        <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Acesso desativado</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Sua conta existe, mas o acesso ao sistema está desativado. Fale com o responsável no Instituto.
          </p>
          <form action="/api/sair" method="post" className="mt-4">
            <button type="submit" className="text-sm text-blue-700 hover:underline">
              Sair
            </button>
          </form>
        </div>
      </main>
    );
  }

  const pendentes = await lancamentos.contarPendentes(db);

  return (
    <div className="flex min-h-screen">
      <Sidebar nome={perfil.nome} pendentes={pendentes} />
      <main className="min-w-0 flex-1 p-6">{children}</main>
      <IdleLogout />
    </div>
  );
}
