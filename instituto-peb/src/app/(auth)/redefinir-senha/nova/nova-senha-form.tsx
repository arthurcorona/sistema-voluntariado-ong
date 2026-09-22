'use client';

import { useActionState } from 'react';
import { definirNovaSenha, type AuthState } from '@/actions/auth';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function NovaSenhaForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(definirNovaSenha, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.erro && <Alert tone="error">{state.erro}</Alert>}
      <Field label="Nova senha" htmlFor="senha" hint="Mínimo de 8 caracteres.">
        <Input id="senha" name="senha" type="password" autoComplete="new-password" required minLength={8} autoFocus />
      </Field>
      <Field label="Repita a senha" htmlFor="confirmacao">
        <Input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" required />
      </Field>
      <Button type="submit" loading={pending}>
        Salvar nova senha
      </Button>
    </form>
  );
}
