'use client';

import { useActionState } from 'react';
import { entrar, type AuthState } from '@/actions/auth';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(entrar, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.erro && <Alert tone="error">{state.erro}</Alert>}
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus defaultValue={state.email ?? ''} aria-invalid={state.erro ? true : undefined} />
      </Field>
      <Field label="Senha" htmlFor="senha">
        <Input id="senha" name="senha" type="password" autoComplete="current-password" required aria-invalid={state.erro ? true : undefined} />
      </Field>
      <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
        Entrar
      </Button>
    </form>
  );
}
