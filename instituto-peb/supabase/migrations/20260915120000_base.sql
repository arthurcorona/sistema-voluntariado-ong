-- =============================================================================
-- 0001 · Base: extensões e utilitários compartilhados
-- =============================================================================

-- gen_random_uuid() já vem habilitado no Supabase; deixamos explícito.
create extension if not exists pgcrypto with schema extensions;

-- Busca textual tolerante (ILIKE '%termo%' com índice) em nome de fornecedor
-- e descrição do lançamento.
create extension if not exists pg_trgm with schema extensions;

-- Mantém atualizado_em em dia em qualquer tabela que tenha a coluna.
create or replace function public.atualizar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

comment on function public.atualizar_atualizado_em() is
  'Trigger BEFORE UPDATE: grava now() em atualizado_em.';
