import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NovaSenhaForm } from './nova-senha-form';

export default async function NovaSenhaPage() {
  const db = await createClient();
  const { data } = await db.auth.getUser();
  if (!data.user) redirect('/login?erro=link');
  return (
    <>
      <p className="mb-4 text-sm text-zinc-600">Crie uma nova senha para {data.user.email}.</p>
      <NovaSenhaForm />
    </>
  );
}
