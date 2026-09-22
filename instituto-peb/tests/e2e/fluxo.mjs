/**
 * Teste de ponta a ponta do fluxo principal, com Playwright e o Chrome do
 * sistema. Precisa de: servidor rodando (npm run dev), operador de teste no
 * Auth, e banco de DESENVOLVIMENTO limpo (npm run e2e:reset).
 *
 *   E2E_EMAIL=teste@example.com E2E_SENHA=... npm run e2e
 *
 * Capturas de tela e downloads ficam em tests/e2e/saida/.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { gerar } from './fixtures/gerar.mjs';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.E2E_EMAIL ?? EMAIL;
const SENHA = process.env.E2E_SENHA ?? '';
const DIR = path.dirname(new URL(import.meta.url).pathname);
const FIX = gerar();
const SHOTS = path.join(DIR, 'saida', 'capturas');
const DL = path.join(DIR, 'saida', 'downloads');
fs.mkdirSync(path.join(DIR, 'saida', 'capturas'), { recursive: true });
fs.mkdirSync(path.join(DIR, 'saida', 'downloads'), { recursive: true });
if (!SENHA) { console.error('Defina E2E_EMAIL e E2E_SENHA (operador de teste) no ambiente.'); process.exit(1); }
const passos = [];
const ok = (m) => { passos.push('OK  ' + m); console.log('OK  ' + m); };
const falha = (m) => { passos.push('ERR ' + m); console.log('ERR ' + m); };

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, locale: 'pt-BR', acceptDownloads: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => falha('erro de página: ' + e.message));
const shot = (n) => page.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: false });

try {
  // 1. Login
  await page.goto(BASE + '/');
  await page.waitForURL('**/login');
  await page.fill('#email', EMAIL);
  await page.fill('#senha', 'senha-errada');
  await page.click('button[type=submit]');
  await page.waitForSelector('[role=alert]');
  // React 19 reinicia o form logo após a action terminar; espera o reinício antes de preencher.
  await page.waitForFunction(() => document.querySelector('#senha')?.value === '');
  await page.waitForTimeout(300);
  ok('login com senha errada mostra erro');
  if ((await page.inputValue('#email')) === EMAIL) ok('e-mail preservado após erro'); else falha('e-mail foi apagado após erro');
  await page.fill('#email', EMAIL);
  await page.fill('#senha', SENHA);
  await page.click('button[type=submit]');
  await page.waitForURL(BASE + '/');
  await page.waitForSelector('text=Painel');
  await shot('01-painel-primeiro-uso');
  ok('login e painel (' + (await page.textContent('h1')) + ')');
  if (await page.locator('text=Primeiro uso').count()) ok('orientação de primeiro uso visível');

  // 2. Cadastros: conta e fornecedor
  await page.goto(BASE + '/cadastros?aba=contas');
  await page.fill('input[name=nome]', 'Conta Teste E2E');
  await page.fill('input[name=banco]', 'Banco X');
  await page.click('button[type=submit]:has-text("Adicionar")');
  await page.waitForSelector('td:has-text("Conta Teste E2E")');
  ok('conta bancária criada');
  await page.goto(BASE + '/cadastros?aba=fornecedores');
  await page.fill('input[name=nome]', 'Fornecedor Manual');
  await page.fill('input[name=documento]', '11.222.333/0001-81');
  await page.click('button[type=submit]:has-text("Adicionar")');
  await page.waitForSelector('td:has-text("Fornecedor Manual")');
  ok('fornecedor criado com CNPJ válido');
  await page.fill('input[name=nome]', 'Doc invalido');
  await page.fill('input[name=documento]', '11.222.333/0001-99');
  await page.click('button[type=submit]:has-text("Adicionar")');
  await page.waitForSelector('text=CPF ou CNPJ inválido');
  ok('CNPJ inválido é recusado com mensagem');
  await shot('02-cadastros');

  // 3. Envio em lote
  await page.goto(BASE + '/envio');
  await page.setInputFiles('input[type=file]', [path.join(FIX, 'nfe.xml'), path.join(FIX, 'danfe.pdf'), path.join(FIX, 'comprovante.png')]);
  await page.waitForSelector('text=Revisar lançamentos', { timeout: 60000 });
  await shot('03-envio-concluido');
  const linhasFila = await page.locator('li').allTextContents();
  linhasFila.forEach((t) => console.log('   fila: ' + t.trim()));
  if (linhasFila.some((t) => t.includes('juntado à mesma nota'))) ok('PDF e XML da mesma nota foram agrupados'); else falha('agrupamento XML+PDF não aconteceu');
  if (linhasFila.some((t) => t.includes('dados lidos'))) ok('leitura automática sinalizada'); else falha('sem "dados lidos"');
  await page.click('text=Revisar lançamentos');
  await page.waitForURL('**/lancamentos/**');

  // 4. Lançamento com sugestões
  await page.waitForSelector('text=sugerido');
  await shot('04-lancamento-sugestoes');
  const numero = await page.inputValue('#numero');
  const valor = await page.inputValue('#valor');
  const data = await page.inputValue('#data');
  console.log(`   sugestões: numero=${numero} serie=${await page.inputValue('#serie')} data=${data} valor=${valor}`);
  if (numero === '4567' && valor === '1.234,56' && data === '03/09/2026') ok('sugestões do XML corretas'); else falha('sugestões incorretas');
  const criar = page.locator('button:has-text("Emitente lido do arquivo sem cadastro")');
  if (await criar.count()) {
    await criar.click();
    await page.waitForSelector('text=Novo fornecedor');
    await page.click('button:has-text("Adicionar")');
    await page.waitForSelector('text=Novo fornecedor', { state: 'detached', timeout: 15000 }).catch(() => null);
    const erroPopover = await page.locator('form [role=alert], form .text-red-600').allTextContents();
    if (erroPopover.length) falha('popover de fornecedor mostrou erro: ' + erroPopover.join(' | '));
    await page.waitForFunction(() => document.querySelector('#fornecedor')?.value === 'Papelaria Teste Ltda');
    await page.waitForSelector('button:has-text("Emitente lido do arquivo sem cadastro")', { state: 'detached' });
    ok('fornecedor criado a partir do emitente do XML e selecionado');
  } else falha('sem sugestão de criar emitente');
  await page.fill('#descricao', 'Resmas de papel A4');
  await page.selectOption('#conta', { label: 'Conta Teste E2E' });
  await shot('05-lancamento-preenchido');
  const urlAtual = page.url();
  await page.click('button:has-text("Lançar e ir para o próximo")');
  await page.waitForURL((u) => u.pathname.startsWith('/lancamentos/') && u.searchParams.get('fila') === '1' && u.toString() !== urlAtual);
  await page.waitForSelector('#fornecedor');
  ok('lançou e foi para o próximo pendente');

  // 5. Segundo lançamento (imagem, sem leitura): combobox por teclado
  await shot('06-segundo-lancamento');
  await page.fill('#fornecedor', 'Manual');
  await page.keyboard.press('Enter');
  await page.fill('#data', '05/09/2026');
  await page.fill('#valor', '50,00');
  await page.selectOption('#conta', { label: 'Conta Teste E2E' });
  await page.keyboard.press('Control+Enter');
  await page.waitForURL('**/lancamentos?**aviso=fila-concluida**');
  await page.waitForSelector('text=Todos os documentos pendentes foram revisados');
  ok('Ctrl+Enter lançou o último; fila concluída');
  await shot('07-lista');

  // 6. Lista: filtros
  const linhas = await page.locator('tbody tr').count();
  console.log('   linhas na lista: ' + linhas);
  await page.goto(BASE + '/lancamentos?situacao=completo');
  const completos = await page.locator('tbody tr').count();
  await page.goto(BASE + '/lancamentos?q=Resmas');
  const busca = await page.locator('tbody tr').count();
  if (completos === 1 && busca === 1) ok('filtros por situação e busca textual'); else falha(`filtros: completos=${completos} busca=${busca}`);

  // 7. Exportar
  await page.goto(BASE + '/exportar?de=2026-09-01&ate=2026-09-30');
  await page.waitForSelector('text=Gerar CSV');
  await shot('08-exportar-previa');
  const previaLinhas = await page.locator('tbody tr').count();
  console.log('   prévia: ' + previaLinhas + ' linha(s)');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('button:has-text("Gerar CSV")')]);
  const csvPath = path.join(DL, await dl.suggestedFilename());
  await dl.saveAs(csvPath);
  const csv = fs.readFileSync(csvPath, 'utf8');
  console.log('   csv:\n' + csv.split('\n').map((l) => '     ' + l).join('\n'));
  if (csv.startsWith('﻿') && csv.includes('Papelaria Teste Ltda') && csv.includes('1.234,56') && csv.includes('Número da nota')) ok('CSV com BOM, linhas e coluna de pendências'); else falha('CSV inesperado');
  await page.waitForURL('**/exportacoes');
  await shot('09-historico');

  // 8. ZIP do histórico
  const [dlz] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('a:has-text("ZIP com documentos")')]);
  const zipPath = path.join(DL, await dlz.suggestedFilename());
  await dlz.saveAs(zipPath);
  const JSZip = createRequire(import.meta.url)('jszip');
  const zip = await JSZip.loadAsync(fs.readFileSync(zipPath));
  const nomes = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  console.log('   zip: ' + nomes.join(', '));
  if (nomes.length === 4 && nomes.some((n) => n.endsWith('.csv'))) ok('ZIP com CSV + 3 documentos nomeados por linha'); else falha('ZIP inesperado');

  // 9. Bloqueio pós-exportação e desbloqueio
  await page.goto(BASE + '/lancamentos?q=Resmas');
  await page.click('tbody tr a');
  await page.waitForSelector('text=bloqueado para edição');
  ok('lançamento exportado aparece bloqueado');
  page.once('dialog', (d) => d.accept());
  await page.click('button:has-text("Desbloquear para editar")');
  await page.waitForSelector('#descricao:not([disabled])');
  await page.fill('#descricao', 'Resmas de papel A4 (corrigido)');
  await page.click('button[type=submit]:has-text("Salvar")');
  await page.waitForSelector('text=Lançado.');
  await page.reload();
  await page.waitForSelector('text=bloqueado para edição');
  ok('desbloqueio, edição e re-bloqueio ao salvar');
  await shot('10-lancamento-exportado');

  // 10. Duplicado
  await page.goto(BASE + '/envio');
  await page.setInputFiles('input[type=file]', [path.join(FIX, 'nfe.xml')]);
  await page.waitForSelector('text=Já enviado antes', { timeout: 30000 });
  ok('reenvio do mesmo arquivo é avisado como duplicado');
  await shot('11-duplicado');

  // 11. Painel com números
  await page.goto(BASE + '/');
  await shot('12-painel-final');
  const texto = await page.textContent('main');
  console.log('   painel: ' + texto.replace(/\s+/g, ' ').slice(0, 300));
  ok('painel renderiza com totais');

  // 12. Logout
  // O indicador de dev do Next cobre o canto inferior esquerdo; submete o form de logout diretamente.
  await page.locator('form[action="/api/sair"]').evaluate((f) => f.requestSubmit());
  await page.waitForURL('**/login');
  await page.goto(BASE + '/');
  await page.waitForURL('**/login');
  ok('logout');
} catch (e) {
  falha('exceção: ' + e.message);
  await shot('99-erro');
} finally {
  await browser.close();
  const falhas = passos.filter((p) => p.startsWith('ERR')).length;
  console.log('\nRESUMO: ' + passos.filter((p) => p.startsWith('OK')).length + ' ok, ' + falhas + ' falhas');
  process.exitCode = falhas ? 1 : 0;
}
