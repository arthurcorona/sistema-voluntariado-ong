# services

Regra de negócio. Um arquivo por entidade (`lancamentos.ts`, `fornecedores.ts`…).

- Funções puras sempre que possível; testáveis sem banco.
- Recebe dados já validados (a Server Action valida com Zod antes).
- Persiste através de `src/repositories`, nunca chamando o Supabase direto.
- `csv/` concentra colunas, ordem, separador e codificação do arquivo do contador. Mexeu no formato, mexeu só aqui.
- `extracao/` lê XML de NF-e e chave de acesso em PDF. Nunca lança erro para cima: devolve o que achou, ou nada.
