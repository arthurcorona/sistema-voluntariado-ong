# Instituto PEB · Sistema de notas fiscais

Sistema web para registrar notas fiscais recebidas por uma ONG e gerar o CSV mensal para o contador. Cinco estudantes, trabalho voluntário, escopo fechado por contrato (Anexo I: proposta v2). Entrega: 30/10/2026.

**Premissa que decide tudo:** ninguém terá dedicação exclusiva. Cadastrar uma nota precisa levar menos de 30 segundos. Uso irregular e preenchimento parcial são o caso normal, não a exceção.

## Stack
Next.js (App Router, TypeScript, full-stack) · Supabase (Postgres, Auth, Storage) · Tailwind · Vercel. Sem backend separado, sem ORM. Não introduza NestJS, Express, Prisma ou similares sem consultar.

## Arquitetura (não negociável)
- `src/actions/` — Server Actions finas: Zod → service → resultado. Zero regra de negócio.
- `src/services/` — regra de domínio, um arquivo por entidade, funções puras quando possível.
- `src/repositories/` — único lugar que chama o Supabase. Componentes e rotas nunca chamam o cliente direto.
- `src/types/database.ts` — gerado por `npm run db:types`. Nunca editado à mão, nunca duplicado.
- `src/services/csv/` — formato do CSV do contador (ainda indefinido). Colunas, ordem, separador e codificação só aqui.
- Migrations em `supabase/migrations/`, SQL puro, versionadas.

## Convenções
- Dinheiro: sempre inteiro em centavos. `src/lib/money.ts` é a única fronteira com texto.
- Datas de nota: string ISO `AAAA-MM-DD` internamente; `DD/MM/AAAA` na tela. `src/lib/dates.ts`. Nunca `new Date()` com hora local para dia de nota.
- Banco (tabelas, colunas, funções, triggers) em português. Código TypeScript em inglês; arquivos de entidade seguem o nome da entidade.
- Interface 100% em português do Brasil. Mensagens de erro dizem o campo e o que corrigir, sem jargão.
- Restrições de integridade vivem no banco (unique, check, FK, RLS, triggers), não só na aplicação.

## Regras de produto que não são óbvias
- Lançamento nasce vazio no upload e fica **pendente de revisão** até alguém clicar em "Lançar". Pendente não é exportável, mesmo com dados lidos do XML.
- Exportação **inclui registros incompletos** (fornecedor + data + valor bastam). Pendências saem em coluna própria. Pedido do cliente; não "conserte".
- Campo preenchido automaticamente aparece como sugestão pendente de conferência, visualmente distinto do digitado.
- Lançamento exportado fica bloqueado; edição exige desbloqueio explícito.
- Sem OCR. Imagem é preenchida à mão.
- Fora de escopo (não construa): emissão de NF, integração contábil, leitura de e-mail, conciliação, contas a pagar, orçamento, mobile, rateio, relatórios/gráficos, perfis de permissão, entradas de recurso.

## Comandos
`npm run dev` · `npm run typecheck` · `npm run lint` · `npm test` · `npm run db:push` · `npm run db:types`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
