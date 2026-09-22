'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { emailSchema, loginSchema, novaSenhaSchema } from '@/lib/validation/auth';

export type AuthState = { erro?: string; sucesso?: string; /** Mantém o e-mail digitado após erro (React 19 reinicia o form). */ email?: string };

export async function entrar(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    senha: formData.get('senha'),
  });
  const email = String(formData.get('email') ?? '');
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? 'Dados inválidos.', email };

  const db = await createClient();
  const { error } = await db.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  });
  if (error) {
    return { erro: 'E-mail ou senha incorretos. Se esqueceu a senha, use "Esqueci minha senha".', email };
  }
  redirect('/');
}

export async function sair(): Promise<void> {
  const db = await createClient();
  await db.auth.signOut();
  redirect('/login');
}

export async function solicitarRedefinicao(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? 'E-mail inválido.', email: String(formData.get('email') ?? '') };

  const db = await createClient();
  const origin = await siteOrigin();
  await db.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/redefinir-senha/nova`,
  });
  // Mesma resposta exista ou não a conta: não revela quem tem acesso.
  return { sucesso: 'Se este e-mail tiver acesso, enviamos um link para redefinir a senha. Confira a caixa de entrada e o spam.' };
}

export async function definirNovaSenha(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = novaSenhaSchema.safeParse({
    senha: formData.get('senha'),
    confirmacao: formData.get('confirmacao'),
  });
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const db = await createClient();
  const { error } = await db.auth.updateUser({ password: parsed.data.senha });
  if (error) return { erro: 'Não foi possível alterar a senha. O link pode ter expirado; peça um novo.' };
  redirect('/');
}

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get('origin');
  if (origin) return origin;
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}
