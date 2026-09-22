import Link from 'next/link';
import { RedefinirForm } from './redefinir-form';

export default function RedefinirSenhaPage() {
  return (
    <>
      <p className="mb-4 text-sm text-zinc-600">Informe seu e-mail. Enviaremos um link para criar uma nova senha.</p>
      <RedefinirForm />
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-blue-700 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </>
  );
}
