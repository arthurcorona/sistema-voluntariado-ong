-- =============================================================================
-- 0003 · Cadastros: fornecedores e contas bancárias
-- =============================================================================

-- ---------------------------------------------------------------- fornecedores
create table public.fornecedores (
  id            uuid        primary key default gen_random_uuid(),
  nome          text        not null,
  -- CPF (11) ou CNPJ (14), somente dígitos. A formatação é responsabilidade
  -- da aplicação. Usado para casar o CNPJ do emitente lido do XML/DANFE.
  documento     text,
  ativo         boolean     not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint fornecedores_nome_nao_vazio
    check (btrim(nome) <> ''),
  constraint fornecedores_documento_formato
    check (documento is null or documento ~ '^[0-9]{11}$' or documento ~ '^[0-9]{14}$')
);

comment on table  public.fornecedores           is 'Quem emitiu a nota fiscal. Nunca é excluído se houver lançamento; apenas inativado.';
comment on column public.fornecedores.documento is 'CPF ou CNPJ apenas com dígitos. Nulo quando desconhecido.';

-- Mesmo CPF/CNPJ não pode aparecer em dois fornecedores.
create unique index fornecedores_documento_unique
  on public.fornecedores (documento)
  where documento is not null;

-- Busca por nome no combobox.
create index fornecedores_nome_trgm
  on public.fornecedores using gin (nome extensions.gin_trgm_ops);

create trigger fornecedores_atualizado_em
  before update on public.fornecedores
  for each row execute function public.atualizar_atualizado_em();

-- ----------------------------------------------------------- contas_bancarias
create table public.contas_bancarias (
  id            uuid        primary key default gen_random_uuid(),
  -- Nome pelo qual o Instituto chama a conta no dia a dia.
  -- Ex.: "Conta Projeto Educação".
  nome          text        not null,
  banco         text,
  numero        text,
  ativo         boolean     not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint contas_bancarias_nome_nao_vazio
    check (btrim(nome) <> '')
);

comment on table public.contas_bancarias is 'Contas de onde saem os pagamentos. Critério de organização pedido pelo Instituto.';

-- Evita duas contas com o mesmo nome (ignorando caixa).
create unique index contas_bancarias_nome_unique
  on public.contas_bancarias (lower(btrim(nome)));

create trigger contas_bancarias_atualizado_em
  before update on public.contas_bancarias
  for each row execute function public.atualizar_atualizado_em();
