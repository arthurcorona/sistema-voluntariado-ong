# repositories

Único lugar do projeto que fala com o Supabase (banco e Storage).

- Um arquivo por tabela, mais `storage.ts`.
- Recebe o cliente já criado (`createClient()` de `src/lib/supabase/server.ts`).
- Só consulta e grava. Nenhuma regra de negócio, nenhum cálculo.
- Tipos vêm de `src/types/database.ts` (gerado por `npm run db:types`). Não escreva tipos de tabela à mão.
