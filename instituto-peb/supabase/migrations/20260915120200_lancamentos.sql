-- =============================================================================
-- 0004 · Lançamentos e anexos
-- =============================================================================

-- ------------------------------------------------------------------ lancamentos
-- Todos os campos de negócio são nulos de propósito: o registro nasce vazio
-- quando o arquivo é enviado e vai sendo completado (RF011, RF033).
--
-- "Exportável" (RF031) e "completo" (RF032) NÃO são colunas (RNF032);
-- ver a view vw_lancamentos.
create table public.lancamentos (
  id                uuid        primary key default gen_random_uuid(),
  fornecedor_id     uuid        references public.fornecedores(id)      on delete restrict,
  numero_nota       text,
  -- [PROPOSTA] Série da NF-e. RF020 e RF021 extraem a série, mas o modelo
  -- da análise não tem onde guardá-la. Faz parte da identidade fiscal da
  -- nota e por isso entra no índice único. Se não quiser, remova a coluna
  -- e o coalesce do índice abaixo.
  serie_nota        text,
  data_nota         date,
  -- Sempre inteiro em centavos. Nunca float (RF034, RNF031).
  valor_centavos    integer,
  descricao         text,
  conta_bancaria_id uuid        references public.contas_bancarias(id)  on delete restrict,
  -- Marca a revisão humana. Nulo = "pendente de revisão": o registro nasceu
  -- do envio do arquivo e ninguém confirmou os dados ainda. Enquanto nulo,
  -- o lançamento NÃO é exportável, mesmo que a leitura automática tenha
  -- encontrado tudo. Preenchido pela aplicação ao clicar em "Lançar";
  -- revisado_por é preenchido por trigger.
  revisado_em       timestamptz,
  revisado_por      uuid        references public.perfis(id) on delete set null,
  -- Verdadeiro desde a primeira exportação (RF037). O desbloqueio explícito
  -- é um UPDATE que põe falso; o trigger abaixo recusa edição enquanto true.
  bloqueado         boolean     not null default false,
  criado_por        uuid        references public.perfis(id) on delete set null default auth.uid(),
  atualizado_por    uuid        references public.perfis(id) on delete set null,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),

  constraint lancamentos_valor_positivo
    check (valor_centavos is null or valor_centavos > 0),
  constraint lancamentos_numero_nota_nao_vazio
    check (numero_nota is null or btrim(numero_nota) <> ''),
  constraint lancamentos_serie_nota_nao_vazia
    check (serie_nota is null or btrim(serie_nota) <> '')
);

comment on table  public.lancamentos                is 'Uma nota fiscal ou comprovante recebido. Substitui a linha da planilha.';
comment on column public.lancamentos.valor_centavos is 'Valor total da nota em centavos de real. Nunca use float.';
comment on column public.lancamentos.revisado_em    is 'Quando um operador confirmou os dados. Nulo = pendente de revisão, não exportável.';
comment on column public.lancamentos.revisado_por   is 'Quem confirmou os dados. Preenchido por trigger quando revisado_em deixa de ser nulo.';
comment on column public.lancamentos.bloqueado      is 'Ligado ao exportar (RF037). Desligar é o desbloqueio explícito; a aplicação religa ao salvar.';
comment on column public.lancamentos.criado_por     is 'Quem enviou o arquivo que originou o registro (RF070).';
comment on column public.lancamentos.atualizado_por is 'Quem salvou a última alteração de campo de negócio (RF071). Preenchido por trigger.';

-- Impede a mesma nota (mesmo fornecedor, número e série) duas vezes (RF035).
-- Parcial: registros ainda sem número ou sem fornecedor não entram.
create unique index lancamentos_nota_por_fornecedor_unique
  on public.lancamentos (fornecedor_id, numero_nota, coalesce(serie_nota, ''))
  where numero_nota is not null and fornecedor_id is not null;

-- Filtros da tela de lista (RF051).
create index lancamentos_data_nota_idx         on public.lancamentos (data_nota desc);
create index lancamentos_fornecedor_id_idx     on public.lancamentos (fornecedor_id);
create index lancamentos_conta_bancaria_id_idx on public.lancamentos (conta_bancaria_id);
create index lancamentos_criado_em_idx         on public.lancamentos (criado_em desc);

-- Busca textual (RF052).
create index lancamentos_descricao_trgm
  on public.lancamentos using gin (descricao extensions.gin_trgm_ops);
create index lancamentos_numero_nota_trgm
  on public.lancamentos using gin (numero_nota extensions.gin_trgm_ops);

-- Um único trigger BEFORE UPDATE com quatro responsabilidades:
--   1. recusar alteração de campo de negócio enquanto bloqueado (RF037);
--   2. gravar quem alterou e quando, só se algum campo de negócio mudou (RF071);
--   3. gravar quem revisou, quando revisado_em passa de nulo a preenchido;
--   4. manter atualizado_em.
create or replace function public.lancamentos_antes_de_atualizar()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  mudou_negocio boolean :=
    (new.fornecedor_id, new.numero_nota, new.serie_nota, new.data_nota,
     new.valor_centavos, new.descricao, new.conta_bancaria_id)
    is distinct from
    (old.fornecedor_id, old.numero_nota, old.serie_nota, old.data_nota,
     old.valor_centavos, old.descricao, old.conta_bancaria_id);
begin
  if mudou_negocio and old.bloqueado and new.bloqueado then
    raise exception 'Lançamento já exportado. Desbloqueie antes de alterar.'
      using errcode = 'check_violation';
  end if;

  if mudou_negocio then
    new.atualizado_por := coalesce(auth.uid(), old.atualizado_por);
    new.atualizado_em  := now();
  end if;

  if old.revisado_em is null and new.revisado_em is not null then
    new.revisado_por := coalesce(auth.uid(), new.revisado_por);
  end if;

  return new;
end;
$$;

create trigger lancamentos_antes_de_atualizar
  before update on public.lancamentos
  for each row execute function public.lancamentos_antes_de_atualizar();

-- ---------------------------------------------------------------------- anexos
-- Um lançamento pode ter mais de um arquivo (RF016), ex.: PDF e XML da
-- mesma nota. Remover um anexo (RF018) é DELETE aqui + remoção no Storage.
create table public.anexos (
  id              uuid        primary key default gen_random_uuid(),
  lancamento_id   uuid        not null references public.lancamentos(id) on delete cascade,
  -- Caminho no bucket "anexos", gerado pelo sistema: AAAA/MM/{uuid}.{ext}.
  -- Nunca o nome original (RNF024).
  storage_path    text        not null,
  nome_original   text        not null,
  mime_type       text        not null,
  -- Hex minúsculo, 64 caracteres. Único: o mesmo arquivo não entra duas vezes (RF015).
  hash_sha256     text        not null,
  tamanho_bytes   bigint      not null,
  -- [PROPOSTA] O que a leitura automática (RF020, RF021) encontrou neste
  -- arquivo, em bruto. A tela lê daqui para exibir as sugestões marcadas
  -- como "pendente de conferência" (RF022); as colunas de lancamentos só
  -- recebem o valor quando a pessoa salva.
  -- Ex.: {"fonte":"xml","numero":"123","serie":"1","emissao":"2026-09-01",
  --       "valor_centavos":15000,"cnpj_emitente":"12345678000199"}
  dados_extraidos jsonb,
  criado_em       timestamptz not null default now(),

  constraint anexos_storage_path_unique unique (storage_path),
  constraint anexos_hash_sha256_unique  unique (hash_sha256),
  constraint anexos_hash_sha256_formato
    check (hash_sha256 ~ '^[0-9a-f]{64}$'),
  constraint anexos_tamanho_positivo
    check (tamanho_bytes > 0),
  constraint anexos_mime_type_permitido
    check (mime_type in ('application/pdf', 'image/jpeg', 'image/png',
                         'application/xml', 'text/xml'))
);

comment on table  public.anexos                 is 'Arquivo original guardado no Storage, vinculado a um lançamento.';
comment on column public.anexos.hash_sha256     is 'SHA-256 do conteúdo. A violação do unique é o aviso de "arquivo já enviado".';
comment on column public.anexos.dados_extraidos is 'Sugestões lidas automaticamente do arquivo. Nulo quando nada foi encontrado.';

create index anexos_lancamento_id_idx on public.anexos (lancamento_id);
