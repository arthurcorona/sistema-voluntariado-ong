-- =============================================================================
-- 0009 · Ajustes do MVP
-- =============================================================================

-- 1) CNPJ alfanumérico. Desde julho de 2026 a Receita emite CNPJ com letras
--    nas 12 primeiras posições; os 2 dígitos verificadores continuam numéricos.
alter table public.fornecedores
  drop constraint fornecedores_documento_formato;
alter table public.fornecedores
  add constraint fornecedores_documento_formato
  check (documento is null
         or documento ~ '^[0-9]{11}$'
         or documento ~ '^[0-9A-Z]{12}[0-9]{2}$');

comment on column public.fornecedores.documento is
  'CPF (11 dígitos) ou CNPJ (12 alfanuméricos + 2 dígitos), sem formatação. Nulo quando desconhecido.';

-- 2) Registro atômico de exportação: cabeçalho + itens numa única transação,
--    com totais calculados aqui para nunca divergirem dos lançamentos.
--    Só aceita lançamentos exportáveis (revisados, com fornecedor, data e valor).
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

comment on function public.registrar_exportacao(date, date, text, uuid[]) is
  'Cria exportação e seus itens atomicamente; totais calculados a partir dos lançamentos.';
