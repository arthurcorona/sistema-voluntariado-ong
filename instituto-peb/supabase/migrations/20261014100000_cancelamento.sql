-- =============================================================================
-- 0011 · Cancelamento de lançamento
-- =============================================================================
-- Terceiro estado na interface: Pendente / Concluído / Cancelado.
-- Cancelar não apaga: o registro e os arquivos ficam, com autor, data e
-- motivo, mas o lançamento sai da exportação, do painel e da fila de
-- revisão. Pode ser cancelado mesmo depois de exportado (nota cancelada
-- pelo fornecedor), e pode ser reativado.

alter table public.lancamentos
  add column cancelado_em        timestamptz,
  add column cancelado_por       uuid references public.perfis(id) on delete set null,
  add column motivo_cancelamento text;

comment on column public.lancamentos.cancelado_em        is 'Quando foi cancelado. Nulo = ativo. Cancelado não exporta nem conta no painel.';
comment on column public.lancamentos.cancelado_por       is 'Quem cancelou. Preenchido por trigger.';
comment on column public.lancamentos.motivo_cancelamento is 'Texto livre informado ao cancelar.';

create index lancamentos_cancelado_em_idx on public.lancamentos (cancelado_em) where cancelado_em is not null;

-- Trigger: além das regras anteriores, grava quem cancelou e limpa ao reativar.
-- Cancelar/reativar não é "campo de negócio": continua permitido em lançamento
-- bloqueado (já exportado), de propósito.
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

  if mudou_negocio and old.cancelado_em is not null and new.cancelado_em is not null then
    raise exception 'Lançamento cancelado. Reative antes de alterar.'
      using errcode = 'check_violation';
  end if;

  if mudou_negocio then
    new.atualizado_por := coalesce(auth.uid(), old.atualizado_por);
    new.atualizado_em  := now();
  end if;

  if old.revisado_em is null and new.revisado_em is not null then
    new.revisado_por := coalesce(auth.uid(), new.revisado_por);
  end if;

  if old.cancelado_em is null and new.cancelado_em is not null then
    new.cancelado_por := coalesce(auth.uid(), new.cancelado_por);
  elsif new.cancelado_em is null then
    new.cancelado_por := null;
    new.motivo_cancelamento := null;
  end if;

  return new;
end;
$$;

-- View: colunas novas no fim (create or replace exige), e as flags passam a
-- considerar o cancelamento. situacao ganha o valor 'cancelado'.
create or replace view public.vw_lancamentos
with (security_invoker = true)
as
select
  l.id,
  l.fornecedor_id,
  f.nome                                  as fornecedor_nome,
  f.documento                             as fornecedor_documento,
  l.numero_nota,
  l.serie_nota,
  l.data_nota,
  l.valor_centavos,
  l.descricao,
  l.conta_bancaria_id,
  c.nome                                  as conta_bancaria_nome,
  l.revisado_em,
  l.revisado_por,
  pr.nome                                 as revisado_por_nome,
  l.bloqueado,
  l.criado_por,
  pc.nome                                 as criado_por_nome,
  l.atualizado_por,
  pa.nome                                 as atualizado_por_nome,
  l.criado_em,
  l.atualizado_em,

  (l.revisado_em is null)                 as pendente_revisao,

  (l.cancelado_em   is null
   and l.revisado_em    is not null
   and l.fornecedor_id  is not null
   and l.data_nota      is not null
   and l.valor_centavos is not null)      as exportavel,

  (l.cancelado_em   is null
   and l.revisado_em    is not null
   and l.fornecedor_id  is not null
   and l.data_nota      is not null
   and l.valor_centavos is not null
   and nullif(btrim(l.numero_nota), '') is not null
   and nullif(btrim(l.descricao),   '') is not null
   and l.conta_bancaria_id is not null)   as completo,

  case
    when l.cancelado_em is not null then 'cancelado'
    when l.revisado_em is null then 'pendente_revisao'
    when l.fornecedor_id is null or l.data_nota is null or l.valor_centavos is null
      then 'incompleto'
    when nullif(btrim(l.numero_nota), '') is null
      or nullif(btrim(l.descricao), '') is null
      or l.conta_bancaria_id is null
      then 'exportavel'
    else 'completo'
  end                                     as situacao,

  exists (
    select 1 from public.itens_exportacao i where i.lancamento_id = l.id
  )                                       as exportado,

  (
    select count(*) from public.anexos a where a.lancamento_id = l.id
  )::integer                              as total_anexos,

  l.cancelado_em,
  l.cancelado_por,
  pk.nome                                 as cancelado_por_nome,
  l.motivo_cancelamento,
  (l.cancelado_em is not null)            as cancelado

from public.lancamentos l
left join public.fornecedores     f  on f.id  = l.fornecedor_id
left join public.contas_bancarias c  on c.id  = l.conta_bancaria_id
left join public.perfis           pc on pc.id = l.criado_por
left join public.perfis           pa on pa.id = l.atualizado_por
left join public.perfis           pr on pr.id = l.revisado_por
left join public.perfis           pk on pk.id = l.cancelado_por;

comment on view public.vw_lancamentos is
  'Lançamentos com fornecedor, conta e autores resolvidos; flags pendente_revisao, exportavel, completo, exportado, cancelado e a coluna situacao.';

-- Exportação recusa cancelados, mesmo que alguém monte a lista à mão.
create or replace function public.registrar_exportacao(
  p_periodo_inicio date,
  p_periodo_fim    date,
  p_arquivo_path   text,
  p_lancamentos    uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id             uuid;
  v_esperado       integer := coalesce(array_length(p_lancamentos, 1), 0);
  v_total          integer;
  v_total_centavos bigint;
begin
  if v_esperado = 0 then
    raise exception 'Nenhum lançamento para exportar.' using errcode = 'check_violation';
  end if;

  select count(*), coalesce(sum(l.valor_centavos), 0)
    into v_total, v_total_centavos
    from public.lancamentos l
   where l.id = any (p_lancamentos)
     and l.cancelado_em   is null
     and l.revisado_em    is not null
     and l.fornecedor_id  is not null
     and l.data_nota      is not null
     and l.valor_centavos is not null;

  if v_total <> v_esperado then
    raise exception 'Há lançamentos que não estão aptos à exportação.' using errcode = 'check_violation';
  end if;

  insert into public.exportacoes
    (periodo_inicio, periodo_fim, total_lancamentos, total_centavos, arquivo_path)
  values
    (p_periodo_inicio, p_periodo_fim, v_total, v_total_centavos, p_arquivo_path)
  returning id into v_id;

  insert into public.itens_exportacao (exportacao_id, lancamento_id)
  select v_id, unnest(p_lancamentos);

  return v_id;
end;
$$;
