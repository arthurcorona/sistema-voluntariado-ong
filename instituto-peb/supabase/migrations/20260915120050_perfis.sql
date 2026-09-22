-- =============================================================================
-- 0002 · Perfis de operador
-- =============================================================================
-- Espelho de auth.users no schema público. Guarda o nome exibido e permite
-- desativar um operador sem apagar a conta (RF002, RF070, RF071).
-- Perfil único: não há papéis nem permissões diferentes.

create table public.perfis (
  id            uuid        primary key references auth.users(id) on delete cascade,
  nome          text        not null,
  ativo         boolean     not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint perfis_nome_nao_vazio check (btrim(nome) <> '')
);

comment on table  public.perfis       is 'Operadores do sistema. Criado automaticamente ao cadastrar o usuário no Auth.';
comment on column public.perfis.ativo is 'Falso bloqueia todo acesso aos dados via RLS, mesmo com login válido.';

create trigger perfis_atualizado_em
  before update on public.perfis
  for each row execute function public.atualizar_atualizado_em();

-- Cria o perfil quando o administrador cadastra o usuário no Supabase Auth.
-- Nome vem de user_metadata.nome; se não houver, usa a parte local do e-mail.
create or replace function public.criar_perfil_para_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''),
             split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger auth_users_cria_perfil
  after insert on auth.users
  for each row execute function public.criar_perfil_para_novo_usuario();

-- Usada em todas as políticas de RLS: o usuário está logado E o perfil
-- dele está ativo. Desativar o perfil corta o acesso no banco (RNF023).
create or replace function public.operador_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.ativo
  );
$$;

comment on function public.operador_ativo() is
  'Verdadeiro quando auth.uid() tem perfil ativo. Base de todas as políticas de RLS.';
