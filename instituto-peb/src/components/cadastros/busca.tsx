'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';

/** Campo de busca que atualiza ?q= na URL (server component refaz a consulta). */
export function Busca({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get('q');
        const next = new URLSearchParams(params.toString());
        if (q) next.set('q', String(q));
        else next.delete('q');
        next.delete('pagina');
        router.push(`${pathname}?${next.toString()}`);
      }}
      className="w-72"
    >
      <Input name="q" type="search" defaultValue={params.get('q') ?? ''} placeholder={placeholder} aria-label={placeholder} />
    </form>
  );
}
