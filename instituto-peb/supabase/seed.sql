-- Dados fictícios para desenvolvimento local (supabase db reset).
-- Nunca rode isto no projeto de produção.
-- Usuários são criados pelo painel/CLI do Supabase Auth, não por aqui.

insert into public.contas_bancarias (nome, banco, numero) values
  ('Conta Projeto Educação', 'Banco do Brasil', '12345-6'),
  ('Conta Administrativa',   'Caixa',           '98765-4'),
  ('Conta Convênio 2026',    'Sicoob',          '55555-1');

insert into public.fornecedores (nome, documento) values
  ('Papelaria Central Ltda',        '12345678000199'),
  ('Distribuidora de Alimentos ES', '98765432000188'),
  ('Maria da Silva (serviços)',     '12345678909'),
  ('Fornecedor sem documento',      null);
