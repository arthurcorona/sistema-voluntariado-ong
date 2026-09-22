-- =============================================================================
-- 0005 · Exportações (arquivos gerados para o contador)
-- =============================================================================

-- Registro imutável (RF066, RF067): uma exportação nunca é editada, só
-- gerada e baixada. Por isso não tem atualizado_em; gerada_em faz o papel
-- de criado_em.
create table public.exportacoes (
  id                uuid        primary key default gen_random_uuid(),
  periodo_inicio    date        not null,
  periodo_fim       date        not null,
  gerada_em         timestamptz not null default now(),
  gerada_por        uuid        references public.perfis(id) on delete set null default auth.uid(),
  total_lancamentos integer     not null,
  total_centavos    bigint      not null,
  -- Caminho do CSV no bucket "exportacoes": AAAA/MM/{uuid}.csv.
  -- O ZIP (RF065) não é guardado: é remontado sob demanda a partir do CSV
  -- e dos anexos, para não consumir o plano gratuito do Storage.
  arquivo_path      text        not null,

  constraint exportacoes_periodo_valido
    check (periodo_fim >= periodo_inicio),
  constraint exportacoes_total_lancamentos_nao_negativo
    check (total_lancamentos >= 0),
  constraint exportacoes_total_centavos_nao_negativo
    check (total_centavos >= 0),
  constraint exportacoes_arquivo_path_unique unique (arquivo_path)
);

comment on table public.exportacoes is 'Histórico dos arquivos gerados. Permite baixar de novo um envio anterior.';

create index exportacoes_gerada_em_idx on public.exportacoes (gerada_em desc);

-- Quais lançamentos entraram em cada exportação. Também responde
-- "este lançamento já foi enviado ao contador, e em qual envio?" (RF056).
-- O mesmo lançamento pode aparecer em várias exportações (RF068).
create table public.itens_exportacao (
  id            uuid        primary key default gen_random_uuid(),
  exportacao_id uuid        not null references public.exportacoes(id) on delete cascade,
  -- restrict: lançamento que já foi ao contador não pode ser apagado (RNF033),
  -- senão o histórico deixa de bater com o arquivo que foi enviado.
  lancamento_id uuid        not null references public.lancamentos(id) on delete restrict,
  criado_em     timestamptz not null default now(),

  constraint itens_exportacao_unico unique (exportacao_id, lancamento_id)
);

create index itens_exportacao_lancamento_id_idx on public.itens_exportacao (lancamento_id);

-- Ao entrar numa exportação, o lançamento fica bloqueado para edição (RF037).
create or replace function public.bloquear_lancamento_exportado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.lancamentos
     set bloqueado = true
   where id = new.lancamento_id
     and bloqueado = false;
  return new;
end;
$$;

create trigger itens_exportacao_bloqueia_lancamento
  after insert on public.itens_exportacao
  for each row execute function public.bloquear_lancamento_exportado();
