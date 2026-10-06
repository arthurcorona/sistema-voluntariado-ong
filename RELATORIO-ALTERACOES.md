# Relatório de alterações — Instituto PEB

Data: 06/10/2026.

As cinco solicitações dos arquivos Markdown foram implementadas sobre o projeto do ZIP fornecido. A estrutura, a identidade visual e os fluxos existentes foram preservados. As alterações usam as bibliotecas que o projeto já possuía; `package.json` e `package-lock.json` permanecem iguais aos originais.

## 1. O que é o projeto

É uma aplicação de prestação de contas para registrar notas fiscais e comprovantes e gerar os arquivos enviados à contabilidade.

- **Next.js 16, React 19 e TypeScript:** páginas, componentes e operações no servidor na mesma aplicação.
- **Supabase:** autenticação dos operadores, banco PostgreSQL e armazenamento privado dos anexos e CSVs.
- **Tailwind:** componentes e identidade visual existentes.
- **Leitura automática:** XML de NF-e e texto selecionável de DANFE em PDF. Imagens e PDFs escaneados continuam sendo preenchidos manualmente.
- **Exportação:** CSV e pacote ZIP com os documentos; histórico e bloqueio de lançamentos já exportados.

O fluxo principal é: login → envio dos arquivos → conferência e preenchimento → listagem → exportação → histórico. Fornecedores e contas bancárias são geridos em Cadastros.

A aplicação separa `actions` para validar entradas e responder à interface, `services` para regras de negócio e `repositories` para consultar/gravar no Supabase. Dinheiro continua em centavos inteiros e datas de nota continuam em formato ISO internamente. As migrations existentes definem integridade, políticas de acesso e estados derivados dos lançamentos.

## 2. As cinco alterações

### 2.1. Fila de envio com informação explícita sobre a leitura

Solicitação: `2026-10-06-fila-envio-rotulo-lido.md`.

O rótulo final passou de **Pronto** para **Enviado**. Cada arquivo concluído mostra uma das mensagens:

| Caso | Mensagem |
|---|---|
| Houve dados extraídos | Enviado · dados lidos |
| Não houve dados extraídos | Enviado · sem leitura, preencher à mão |
| Foi agrupado com a mesma nota | Enviado · juntado à mesma nota |

O resumo da fila também passou de “prontos” para “enviados”, para manter a mesma linguagem. Não houve alteração na extração, na detecção de duplicados ou no agrupamento de arquivos.

### 2.2. Pendente/Completo, pendências visíveis e abertura pela linha

Solicitação: `2026-10-06-lista-status-pendente-completo.md`.

A lista, o detalhe e as opções de filtro agora usam somente **Pendente** e **Completo**. Na interface, `pendente_revisao`, `incompleto` e `exportavel` aparecem como Pendente; somente `completo` aparece como Completo.

- A lista mostra “Falta: …” abaixo do status, com tooltip que permite consultar a descrição completa quando o texto fica truncado.
- O detalhe também mostra os campos que faltam. Esse aviso descreve os **dados salvos**, sendo atualizado após salvar ou lançar.
- O status é um link normal, acessível também por teclado.
- Clicar na área restante da linha abre o lançamento. Caixas de seleção e links mantêm suas ações próprias.
- O filtro Pendentes consulta todos os estados diferentes de `completo`.
- URLs antigas, como `?situacao=pendente_revisao`, continuam aceitas e mantêm sua consulta específica. Ao reenviar o formulário de filtros, usa-se a opção agregada apresentada na tela.

A função `pendenciasDe` foi movida para `src/lib/pendencias.ts`. Ela é pura e pode ser usada por componentes de navegador sem importar repositórios do servidor. O serviço a reexporta para preservar os imports existentes do painel e da exportação.

**A regra de exportação continua igual:** um lançamento precisa estar conferido e ter fornecedor, data e valor. Ele pode continuar Pendente na interface por faltar número, descrição ou conta e ainda assim entrar na exportação, com as pendências sinalizadas no CSV.

### 2.3. Painel responsivo

Solicitação: `2026-10-06-painel-responsivo.md`.

Os cartões passam a usar uma coluna em janelas estreitas, duas a partir de 640px e três a partir de 1280px. Os números usam `clamp`, entre 24px e 38px, e podem quebrar quando necessário. `min-w-0` impede o conteúdo de ampliar a coluna e invadir o cartão vizinho.

A lista de pendências perdeu a largura mínima de 760px. Cada linha é um único link. Em janelas estreitas, o motivo aparece abaixo do título e o indicador Conferir/Completar fica oculto. Em telas a partir de 1024px, aparecem as colunas e o indicador de ação.

**Ajuste necessário além do trecho sugerido:** `buttonClass` já adiciona `inline-flex`. Na inspeção visual, isso anulava a classe `hidden` sugerida no MD. Um `span` externo controla a visibilidade, e o interno mantém o estilo existente. Isso também evita links aninhados.

### 2.4. Visualizador próprio de PDF

Solicitação: `2026-10-06-visualizador-pdf-proprio.md`.

O `iframe` foi substituído por `PdfCanvas`, que desenha todas as páginas com o pdf.js distribuído dentro do **unpdf 1.8.1**, já instalado no projeto.

- A biblioteca é importada dinamicamente somente ao exibir um PDF.
- O documento continua sendo obtido pela URL assinada já gerada pelo servidor.
- Cada página é desenhada em canvas, respeitando a largura disponível e a densidade de pixels da tela.
- Há mensagens de carregamento e erro, identificação acessível de cada página e contagem em documentos com várias páginas.
- “Abrir em nova aba” continua disponível no visualizador existente.
- A troca do anexo remonta o componente pela URL, limpa o estado anterior e impede páginas antigas de aparecerem sobre o novo documento.
- O download é cancelado com `AbortController`; a tarefa de renderização é cancelada e os recursos do PDF são liberados ao desmontar. As tipagens desta versão do unpdf expõem essa liberação por `pdf.loadingTask.destroy()`.

Esse ajuste exibe também PDFs compostos somente por imagens, mas **não extrai texto de imagens nem adiciona OCR ou leitura de QR code**. A exibição e a extração de dados continuam sendo operações distintas.

### 2.5. Campos vazios com aparência diferente de dados preenchidos

Solicitação: `2026-10-06-campos-vazios-parecem-preenchidos.md`.

A data vazia mostra **dd/mm/aaaa** e o valor vazio mostra **0,00**, sem gravar esses textos como valores. A dica redundante da data foi removida. Todos os placeholders passam a usar a cor `neutral-500`, mais clara, e itálico.

**Ajuste necessário além do trecho sugerido:** o componente compartilhado de campos tinha `placeholder:text-neutral-600`, que sobrescrevia a cor global. Essa classe foi removida para a regra de `globals.css` produzir o efeito solicitado em Inputs, Textareas e no campo de fornecedor.

## 3. Configuração do seu .env

O Next.js já aceita `.env` automaticamente. Não foi criado nenhum arquivo com credenciais. O modelo e as instruções foram ajustados para o formato que você pediu.

Crie o arquivo dentro de **`instituto-peb/`**, ao lado do `package.json`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA-CHAVE-ANON
```

Não é necessária uma chave `service_role` para os fluxos desta aplicação. Se houver um `.env.local` antigo, ele tem prioridade sobre `.env`; confira essa configuração antes de iniciar.

No PowerShell, a partir da pasta entregue:

```powershell
cd instituto-peb
Copy-Item .env.example .env
# Preencha as variáveis antes de executar os próximos comandos.
npm ci
npm run dev
```

Abra `http://localhost:3000`. Para produção, encerre o servidor de desenvolvimento e execute `npm run build` e `npm start` com as variáveis reais já configuradas. O ZIP contém código-fonte, sem um build com configurações de teste.

As ferramentas auxiliares originais de banco e E2E continuam usando `.env.local`, conforme o README da aplicação. Isso não interfere no uso do `.env` pela aplicação. Se o Supabase for novo, ainda será necessário aplicar as migrations originais e criar o operador, seguindo aquele README. Para o Supabase já usado pelo projeto, estas alterações não exigem migration adicional.

## 4. Arquivos alterados e criados

Caminhos abaixo são relativos à pasta principal do projeto entregue.

| Arquivo | Alteração |
|---|---|
| `instituto-peb/src/components/envio/uploader.tsx` | Rótulos e resumo explícitos sobre envio/leitura. |
| `instituto-peb/src/lib/pendencias.ts` **novo** | Regra pura compartilhada das pendências. |
| `instituto-peb/src/services/lancamentos.ts` | Reexportação da regra, mantendo compatibilidade. |
| `instituto-peb/src/components/lancamentos/situacao-badge.tsx` | Dois estados visuais. |
| `instituto-peb/src/lib/validation/lancamentos.ts` | Novo filtro agregado e URLs antigas aceitas. |
| `instituto-peb/src/repositories/lancamentos.ts` | Consulta de todos os não completos. |
| `instituto-peb/src/app/(app)/lancamentos/page.tsx` | Opções Pendente/Completo no filtro. |
| `instituto-peb/src/components/lancamentos/tabela-lancamentos.tsx` | Linha clicável, status como link e pendências. |
| `instituto-peb/src/components/lancamentos/lancamento-form.tsx` | Pendências dos dados salvos e placeholders novos. |
| `instituto-peb/src/app/globals.css` | Placeholders mais claros e em itálico. |
| `instituto-peb/src/components/ui/input.tsx` | Remoção da cor que anulava o estilo global. |
| `instituto-peb/src/components/ui/card.tsx` | Números adaptáveis e contenção da largura. |
| `instituto-peb/src/app/(app)/page.tsx` | Cartões e lista de pendências responsivos. |
| `instituto-peb/src/components/lancamentos/pdf-canvas.tsx` **novo** | Renderização própria e liberação de recursos. |
| `instituto-peb/src/components/lancamentos/visualizador.tsx` | Integração do canvas no lugar do iframe. |
| `instituto-peb/src/lib/env.ts` | Mensagem de configuração orienta o uso do `.env`. |
| `instituto-peb/.env.example` | Instruções para `.env` e prioridade de `.env.local`. |
| `instituto-peb/README.md` | Inicialização com `.env`, `npm ci` e link para este relatório. |
| `README.md` | Guia de inicialização na pasta correta. |
| `instituto-peb/tests/lancamentos/situacao.test.ts` **novo** | 16 testes de regressão de situação, pendências e filtros. |
| `RELATORIO-ALTERACOES.md` **novo** | Este relatório. |

Nenhum arquivo original foi removido. As migrations, os tipos gerados do banco, as dependências, a extração de documentos e o formato do CSV permanecem iguais aos do ZIP original.

## 5. Validação realizada

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | Passou, sem erros. |
| `npm run lint` | Passou, sem erros ou avisos de lint. |
| `npm test` | 7 arquivos e **53 testes passaram**: 37 existentes e 16 novos. |
| `npm run build` | Build de produção passou, incluindo o bundle de PDF para o navegador. |
| Painel no Chrome | 600px, 800px, 1000px e 1400px: 1/2/2/3 colunas, sem transbordamento horizontal. |
| Lista e formulário no Chrome | Estados e pendências corretos; seleção sem navegação; clique da linha e link por teclado funcionando; placeholders realmente vazios, claros e em itálico. |
| PDFs no Chrome | Duas páginas com conteúdo desenhado, PDF somente imagem, erro de arquivo inválido, recuperação após erro e troca rápida de anexo funcionando. |
| Configuração do Chrome | Perfil de teste com `plugins.always_open_pdf_externally=true`; o canvas continuou exibindo os PDFs. |
| Erros JavaScript de página | Nenhum durante os testes dos componentes. |

Os testes de filtros usam o cliente Supabase real com o transporte HTTP interceptado para conferir as condições enviadas ao PostgREST. Os testes de navegador usam os componentes reais e uma cópia temporária do painel com dados locais de exemplo. Essas páginas e arquivos temporários foram removidos da entrega.

O build usou variáveis temporárias que apontam para localhost, apenas para validar a compilação. Elas não foram gravadas no projeto nem incluídas no ZIP. O runner de testes emite um aviso informativo já relacionado à configuração existente do Vite; isso não impediu a execução dos 53 testes.

**Limite da validação:** sem suas chaves, não foram executados login real, upload para Storage, consulta de lançamentos reais, persistência ou exportação no Supabase. O `npm run e2e` original, que requer banco de desenvolvimento e operador de teste, também não foi executado. A validação do PDF usou documentos gerados localmente; o documento específico do posto mencionado no MD não veio no ZIP. A URL assinada e o CORS do seu Storage devem ser conferidos no ambiente configurado.

## 6. Conteúdo da entrega

O projeto completo e este relatório estão no ZIP atualizado. O relatório também foi disponibilizado separadamente. Não foram incluídos `node_modules`, `.next`, caches, páginas temporárias de validação nem arquivos `.env` com chaves.

## 7. Correção após o teste local: `JWT issued at future`

Durante o teste com o ambiente configurado, o PostgREST recusou temporariamente o token da sessão com `PGRST303: JWT issued at future`. A mensagem indica que a emissão do token está no futuro em relação ao relógio usado para validá-lo. A validação das datas do JWT é descrita na [documentação oficial do PostgREST](https://postgrest.org/en/stable/references/auth.html). O painel voltou a carregar ao repetir a abertura, antes mesmo do ajuste, indicando uma falha intermitente; não foi comprovada nem alterada a causa do desvio no serviço.

Em `instituto-peb/src/lib/supabase/fetch-retentativa.ts`, a única retentativa após 1,5 segundo foi substituída por até três, com intervalos de **1,5, 3 e 6 segundos**. Somente respostas HTTP 401/403 com o código e a mensagem exatos dessa recusa são repetidas. O limite é de quatro chamadas e 10,5 segundos de espera acumulada, além do tempo das chamadas. Se a recusa persistir, o erro original continua sendo retornado.

O corpo da resposta é preservado para o SDK; requisições do tipo `Request` são clonadas para permitir o reenvio do corpo. O cancelamento também interrompe a espera. Como essa recusa ocorre antes da execução no banco, a retentativa não repete uma operação já executada. O mesmo transporte atende aos clientes Supabase do servidor e do navegador.

Foi criado `instituto-peb/tests/lib/fetch-retentativa.test.ts` com **9 testes** para recuperação, limite de tentativas, preservação do erro, reenvio do corpo, cancelamento e ausência de retentativas para erros diferentes. A suite completa passou com **62 testes em 8 arquivos**, assim como `npm run typecheck` e `npm run lint`.

Após o ajuste, a lista de lançamentos e o painel carregaram no navegador com a sessão existente e dados do Supabase configurado. Os testes automatizados simularam as recusas repetidas; o teste real não permite garantir que o serviço nunca voltará a apresentar desvio de relógio. Nesta etapa não foram testados upload, exportação ou gravação de dados, nem foi repetido o build de produção enquanto o servidor de desenvolvimento estava em execução.

A correção foi aplicada à pasta em uso e incluída no ZIP atualizado. Os arquivos locais de credenciais foram preservados na pasta em uso e excluídos do ZIP.
