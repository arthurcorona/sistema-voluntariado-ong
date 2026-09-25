import { redirect } from 'next/navigation';
import { IdleLogout } from '@/components/layout/idle-logout';
import { Sidebar } from '@/components/layout/sidebar';
import { formatMesAno, todayISO } from '@/lib/dates';
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
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-md border border-divider bg-neutral-100 p-7 text-center">
          <h1 className="text-[22px] font-semibold">Acesso desativado</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-800">
            Sua conta existe, mas o acesso ao sistema está desativado. Fale com o responsável no Instituto.
          </p>
          <form action="/api/sair" method="post" className="mt-5">
            <button type="submit" className="text-sm text-accent-700 hover:underline">
              Sair
            </button>
          </form>
        </div>
      </main>
    );
  }

  const pendentes = await lancamentos.contarPendentes(db);
  const competencia = formatMesAno(todayISO());

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar nome={perfil.nome} pendentes={pendentes} competencia={competencia} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      <IdleLogout />
    </div>
  );
}
