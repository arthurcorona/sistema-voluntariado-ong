import Link from 'next/link';
import { RedefinirForm } from './redefinir-form';

export default function RedefinirSenhaPage() {
  return (
    <>
      <p className="mb-4 text-sm leading-relaxed text-neutral-800">Informe seu e-mail. Enviaremos um link para criar uma nova senha.</p>
      <RedefinirForm />
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="text-accent-700 hover:text-accent-800 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </>
  );
}
