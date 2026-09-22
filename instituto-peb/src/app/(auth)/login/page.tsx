import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { LoginForm } from './login-form';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      {erro === 'link' && (
        <Alert tone="error" className="mb-4">
          O link não é mais válido. Peça um novo em &quot;Esqueci minha senha&quot;.
        </Alert>
      )}
      <LoginForm />
      <p className="mt-4 text-center text-sm">
        <Link href="/redefinir-senha" className="text-blue-700 hover:underline">
          Esqueci minha senha
        </Link>
      </p>
    </>
  );
}
