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
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-divider" />
        <span className="text-xs text-neutral-700">ou</span>
        <span className="h-px flex-1 bg-divider" />
      </div>
      <p className="text-center text-sm">
        <Link href="/redefinir-senha" className="text-accent-700 hover:text-accent-800 hover:underline">
          Esqueci minha senha
        </Link>
      </p>
    </>
  );
}
