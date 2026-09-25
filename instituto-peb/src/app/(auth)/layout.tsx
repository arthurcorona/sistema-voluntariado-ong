import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[390px]">
        <div className="mb-7 text-center">
          <Image src="/logo-peb.png" alt="" width={66} height={66} className="mx-auto mb-3 mix-blend-multiply" priority />
          <h1 className="text-[26px] font-semibold">Instituto PEB</h1>
          <p className="kicker mt-1.5">Prestação de contas</p>
        </div>
        <div className="rounded-md border border-divider bg-neutral-100 p-7">{children}</div>
        <p className="mt-4 text-center text-[13px] leading-relaxed text-neutral-700">
          As contas são criadas pela administração.
          <br />
          Sem acesso? Fale com a coordenação.
        </p>
      </div>
    </main>
  );
}
