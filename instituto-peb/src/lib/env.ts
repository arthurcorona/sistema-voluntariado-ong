/**
 * Acesso centralizado às variáveis de ambiente.
 *
 * As NEXT_PUBLIC_* precisam ser referenciadas literalmente
 * (process.env.NEXT_PUBLIC_X) para o Next injetar o valor no bundle do
 * navegador. Por isso não há leitura dinâmica por nome.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. Copie .env.example para .env.local e preencha.`,
    );
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey() {
    return required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
};
