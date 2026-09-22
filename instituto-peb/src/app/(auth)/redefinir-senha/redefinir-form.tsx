'use client';

import { useActionState } from 'react';
import { solicitarRedefinicao, type AuthState } from '@/actions/auth';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function RedefinirForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(solicitarRedefinicao, {});
  if (state.sucesso) return <Alert tone="success">{state.sucesso}</Alert>;
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.erro && <Alert tone="error">{state.erro}</Alert>}
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus defaultValue={state.email ?? ''} />
      </Field>
      <Button type="submit" loading={pending}>
        Enviar link
      </Button>
    </form>
  );
}
