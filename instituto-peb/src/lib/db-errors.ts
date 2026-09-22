/**
 * Traduz erros do Postgres/PostgREST em frases que a pessoa entende.
 * As restrições do banco são a última linha de defesa; aqui elas viram
 * mensagem, em vez de tela branca.
 */

type PgLike = { code?: string; message?: string; details?: string; hint?: string };

const CONSTRAINT_MESSAGES: Record<string, string> = {
  lancamentos_nota_por_fornecedor_unique:
    'Já existe uma nota com este número (e série) para este fornecedor.',
  anexos_hash_sha256_unique: 'Este arquivo já foi enviado antes.',
  anexos_storage_path_unique: 'Conflito interno de nome de arquivo. Tente enviar de novo.',
  fornecedores_documento_unique: 'Já existe um fornecedor com este CPF/CNPJ.',
  contas_bancarias_nome_unique: 'Já existe uma conta bancária com este nome.',
  itens_exportacao_unico: 'Este lançamento já está nesta exportação.',
  lancamentos_valor_positivo: 'O valor precisa ser maior que zero.',
  fornecedores_documento_formato: 'CPF/CNPJ em formato inválido.',
  exportacoes_periodo_valido: 'A data final precisa ser igual ou posterior à inicial.',
};

export class DbError extends Error {
  code?: string;
  details?: string;
  constructor(err: PgLike, context?: string) {
    super(context ? `${context}: ${err.message}` : err.message ?? 'Erro de banco de dados');
    this.name = 'DbError';
    this.code = err.code;
    this.details = err.details;
  }
}

function isPgLike(e: unknown): e is PgLike {
  return typeof e === 'object' && e !== null && ('code' in e || 'message' in e);
}

export function friendlyDbMessage(error: unknown, fallback = 'Não foi possível concluir. Tente de novo.'): string {
  if (!isPgLike(error)) return fallback;
  const text = `${error.message ?? ''} ${error.details ?? ''}`;

  for (const [constraint, message] of Object.entries(CONSTRAINT_MESSAGES)) {
    if (text.includes(constraint)) return message;
  }

  switch (error.code) {
    case '23505':
      return 'Já existe um registro igual a este.';
    case '23503':
      return 'Não é possível excluir: há lançamentos vinculados. Inative em vez de excluir.';
    case '23514':
      // Mensagens dos nossos triggers já vêm em português (raise exception ...)
      return error.message && /[áéíóúãõç]|Lançamento|exportar/i.test(error.message)
        ? error.message.replace(/^.*?: /, '')
        : 'Os dados não passaram na validação do banco.';
    case '42501':
      return 'Seu acesso está desativado ou expirou. Entre de novo.';
    case 'PGRST116':
      return 'Registro não encontrado.';
    default:
      return fallback;
  }
}

type Res<T> = { data: T | null; error: PgLike | null };

/** Só confere erro. Para delete/update sem select e contagens (head: true). */
export function check(res: { error: PgLike | null }, context?: string): void {
  if (res.error) throw new DbError(res.error, context);
}

/** Exige dado. Lança se houver erro ou se a resposta vier vazia. */
export function unwrap<T>(res: Res<T>, context?: string): T {
  if (res.error) throw new DbError(res.error, context);
  if (res.data === null) throw new DbError({ message: 'Resposta vazia do banco' }, context);
  return res.data;
}

/** Aceita nulo como resultado legítimo (maybeSingle). */
export function unwrapMaybe<T>(res: Res<T>, context?: string): T | null {
  if (res.error) throw new DbError(res.error, context);
  return res.data;
}
