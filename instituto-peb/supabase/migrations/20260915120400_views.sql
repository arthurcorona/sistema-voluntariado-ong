-- =============================================================================
-- 0006 · Views derivadas
-- =============================================================================

-- Lançamento com nomes resolvidos e situação derivada (RNF032).
-- security_invoker: a view respeita o RLS de quem consulta.
-- Colunas listadas explicitamente (sem l.*) para que a view não congele
-- silenciosamente quando a tabela ganhar coluna nova.
create view public.vw_lancamentos
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

  -- Pendente de revisão: veio do envio e ninguém confirmou os dados.
  (l.revisado_em is null)                 as pendente_revisao,

  -- Exportável (RF031): revisado e com fornecedor, data e valor.
  -- Um registro só com sugestões automáticas não entra no arquivo.
  (l.revisado_em    is not null
   and l.fornecedor_id  is not null
   and l.data_nota      is not null
   and l.valor_centavos is not null)      as exportavel,

  -- Completo (RF032): exportável e sem nenhum campo em branco.
  (l.revisado_em    is not null
   and l.fornecedor_id  is not null
   and l.data_nota      is not null
   and l.valor_centavos is not null
   and nullif(btrim(l.numero_nota), '') is not null
   and nullif(btrim(l.descricao),   '') is not null
   and l.conta_bancaria_id is not null)   as completo,

  -- Situação única para filtro e indicador na lista (RF051, RF053):
  --   pendente_revisao > incompleto > exportavel > completo
  case
    when l.revisado_em is null then 'pendente_revisao'
    when l.fornecedor_id is null or l.data_nota is null or l.valor_centavos is null
      then 'incompleto'
    when nullif(btrim(l.numero_nota), '') is null
      or nullif(btrim(l.descricao), '') is null
      or l.conta_bancaria_id is null
      then 'exportavel'
    else 'completo'
  end                                     as situacao,

  -- Já foi incluído em alguma exportação anterior? (RF056)
  exists (
    select 1 from public.itens_exportacao i where i.lancamento_id = l.id
  )                                       as exportado,

  (
    select count(*) from public.anexos a where a.lancamento_id = l.id
  )::integer                              as total_anexos

from public.lancamentos l
left join public.fornecedores     f  on f.id  = l.fornecedor_id
left join public.contas_bancarias c  on c.id  = l.conta_bancaria_id
left join public.perfis           pc on pc.id = l.criado_por
left join public.perfis           pa on pa.id = l.atualizado_por
left join public.perfis           pr on pr.id = l.revisado_por;

comment on view public.vw_lancamentos is
  'Lançamentos com fornecedor, conta e autores resolvidos; flags pendente_revisao, exportavel, completo, exportado e a coluna situacao.';
