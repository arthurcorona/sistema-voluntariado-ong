export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Instituto PEB</p>
          <h1 className="text-lg font-semibold text-zinc-900">Notas fiscais</h1>
        </div>
        {children}
      </div>
    </main>
  );
}
