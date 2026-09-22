-- =============================================================================
-- 0007 · Row Level Security
-- =============================================================================
-- Regra do projeto: todo operador com perfil ativo tem o mesmo acesso.
-- Não há papéis. Anônimo e perfil inativo não enxergam nada (RNF023).

alter table public.perfis           enable row level security;
alter table public.fornecedores     enable row level security;
alter table public.contas_bancarias enable row level security;
alter table public.lancamentos      enable row level security;
alter table public.anexos           enable row level security;
alter table public.exportacoes      enable row level security;
alter table public.itens_exportacao enable row level security;

-- Perfis: qualquer operador ativo lê todos (para exibir autores).
-- Criação vem do trigger em auth.users; nome e ativo são geridos pelo
-- administrador no painel do Supabase. Sem insert/update/delete via app.
create policy "operadores ativos: leitura" on public.perfis
  for select to authenticated using (public.operador_ativo());

create policy "operadores ativos: acesso total" on public.fornecedores
  for all to authenticated
  using (public.operador_ativo()) with check (public.operador_ativo());

create policy "operadores ativos: acesso total" on public.contas_bancarias
  for all to authenticated
  using (public.operador_ativo()) with check (public.operador_ativo());

create policy "operadores ativos: acesso total" on public.lancamentos
  for all to authenticated
  using (public.operador_ativo()) with check (public.operador_ativo());

create policy "operadores ativos: acesso total" on public.anexos
  for all to authenticated
  using (public.operador_ativo()) with check (public.operador_ativo());

-- Exportação é histórico: pode criar e ler, não pode alterar nem apagar.
create policy "operadores ativos: leitura" on public.exportacoes
  for select to authenticated using (public.operador_ativo());
create policy "operadores ativos: criação" on public.exportacoes
  for insert to authenticated with check (public.operador_ativo());

create policy "operadores ativos: leitura" on public.itens_exportacao
  for select to authenticated using (public.operador_ativo());
create policy "operadores ativos: criação" on public.itens_exportacao
  for insert to authenticated with check (public.operador_ativo());
