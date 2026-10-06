# Sistema de Voluntariado para ONGs

## Entrega atualizada em 06/10/2026

As cinco alterações solicitadas para o sistema de notas fiscais do Instituto PEB estão aplicadas.
O relatório completo está em [RELATORIO-ALTERACOES.md](RELATORIO-ALTERACOES.md).

A aplicação está na pasta **instituto-peb**, onde fica o `package.json`.
Crie seu **`.env` nessa pasta**, copiando o modelo `.env.example` e preenchendo
`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

```powershell
cd instituto-peb
Copy-Item .env.example .env
npm ci
npm run dev
```

Abra `http://localhost:3000`. Para produção, após configurar as variáveis:
`npm run build` e `npm start`. Não execute o build enquanto o servidor de desenvolvimento estiver aberto.

Os detalhes do banco, primeiro usuário e ferramentas de desenvolvimento estão no
[README da aplicação](instituto-peb/README.md). Se você usar o mesmo Supabase do projeto original,
estas alterações não exigem migrations novas.

Repositório de projetos interdisciplinares: sistemas desenvolvidos pro-bono para ONGs distintas.
Cada sistema fica em sua própria branch.

| Branch | ONG | Descrição |
|---|---|---|
| `instituto-peb` (padrão) | Instituto PEB | Novo projeto, em desenvolvimento. |
| `rede-alsa` | Associação Lar Semente do Amor (Rede ALSA) | Portal de gerenciamento de voluntários (Firebase Hosting, Firestore, Cloud Functions + SendGrid). Concluído. |

## Como navegar

```bash
git checkout rede-alsa       # sistema da Rede ALSA
git checkout instituto-peb   # sistema do Instituto PEB
```
