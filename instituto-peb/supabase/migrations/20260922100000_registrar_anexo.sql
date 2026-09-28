-- =============================================================================
-- 0010 · Registro atômico de anexo
-- =============================================================================
-- Cria (ou reaproveita) o lançamento e grava o anexo numa única transação.
-- Evita lançamento órfão se a chamada cair entre as duas escritas, e faz o
-- agrupamento por chave de acesso (XML + PDF da mesma nota) sem corrida.
create or replace function public.registrar_anexo(
  p_storage_path    text,
  p_nome_original   text,
  p_mime_type       text,
  p_hash_sha256     text,
  p_tamanho_bytes   bigint,
  p_dados_extraidos jsonb,
  p_lancamento_id   uuid default null
)
returns table (anexo_id uuid, lancamento_id uuid, agrupado boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lancamento uuid    := p_lancamento_id;
  v_agrupado   boolean := false;
  v_chave      text    := p_dados_extraidos ->> 'chave';
  v_anexo      uuid;
begin
  -- Sem lançamento informado: procura um pendente de revisão com a mesma chave.
  if v_lancamento is null and v_chave is not null then
    select a.lancamento_id
      into v_lancamento
      from public.anexos a
      join public.lancamentos l on l.id = a.lancamento_id
     where a.dados_extraidos ->> 'chave' = v_chave
       and l.revisado_em is null
     order by a.criado_em
     limit 1;
    v_agrupado := v_lancamento is not null;
  end if;

  if v_lancamento is null then
    insert into public.lancamentos default values returning id into v_lancamento;
  end if;

  insert into public.anexos
    (lancamento_id, storage_path, nome_original, mime_type, hash_sha256, tamanho_bytes, dados_extraidos)
  values
    (v_lancamento, p_storage_path, p_nome_original, p_mime_type, p_hash_sha256, p_tamanho_bytes, p_dados_extraidos)
  returning id into v_anexo;

  return query select v_anexo, v_lancamento, v_agrupado;
end;
$$;

comment on function public.registrar_anexo(text, text, text, text, bigint, jsonb, uuid) is
  'Grava anexo e, se preciso, cria ou agrupa o lançamento, atomicamente.';
