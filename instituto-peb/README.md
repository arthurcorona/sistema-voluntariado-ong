# Instituto PEB · Sistema de notas fiscais

Registro de notas fiscais recebidas e geração do arquivo mensal para a contabilidade. Projeto voluntário de estudantes da Faculdade UCL. Escopo: Proposta v2 (Anexo I do termo).

## Como rodar

```bash
cp .env.example .env.local   # preencha URL e chave anon do Supabase
npm install
npm run dev
```

## Banco de dados

Migrations em `supabase/migrations/`, SQL puro. Os scripts leem `SUPABASE_DB_URL` do `.env.local` (só a CLI usa essa variável; a aplicação não).

```bash
npm run db:push    # aplica migrations pendentes no banco remoto
npm run db:types   # regenera src/types/database.ts (precisa de Docker ou Podman)
npm run db:query -- "select count(*) from lancamentos"
```

`db:types` roda um contêiner do postgres-meta. Sem Docker, basta o socket do Podman do usuário: `systemctl --user start podman.socket`; o script encontra sozinho.

Para ambiente local completo: `npm run db:start`, depois `npm run db:reset` aplica migrations e `supabase/seed.sql` (dados fictícios).

## Primeiro acesso

Não há autocadastro. No painel do Supabase, em Authentication → Users → Add user, crie o operador com e-mail e senha e, em *User Metadata*, `{"nome": "Nome da pessoa"}`. O perfil no sistema é criado automaticamente. Para desativar alguém, `update perfis set ativo = false where id = '...'`.

## Convenções

Leia `CLAUDE.md`. Resumo: actions finas, regra em `services`, banco só em `repositories`, dinheiro em centavos, banco em português e código em inglês.

## Teste de ponta a ponta

`tests/e2e/fluxo.mjs` percorre o fluxo inteiro no navegador (login, cadastros, envio em lote, revisão com sugestões do XML, lista, exportação CSV/ZIP, bloqueio, duplicado, painel). Usa Playwright com o Chrome instalado na máquina.

1. Crie um operador de teste no Auth e informe `E2E_EMAIL` e `E2E_SENHA` no `.env.local`.
2. Com o servidor rodando (`npm run dev`), limpe o banco de desenvolvimento: `E2E_PERMITIR_RESET=sim` no `.env.local` e `npm run e2e:reset`. **Isso apaga todos os dados.**
3. `npm run e2e`. Capturas de tela e arquivos baixados ficam em `tests/e2e/saida/`.
