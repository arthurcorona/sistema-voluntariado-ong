// Apaga TODOS os dados das tabelas públicas e os arquivos do bucket "anexos".
// Só para o projeto de desenvolvimento, antes de rodar o teste de ponta a ponta.
// Lê SUPABASE_DB_URL, NEXT_PUBLIC_SUPABASE_*, E2E_EMAIL e E2E_SENHA do .env.local.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const env = lerEnv(path.join(raiz, '.env.local'));
if (env.E2E_PERMITIR_RESET !== 'sim') {
  console.error('Recusado: defina E2E_PERMITIR_RESET=sim no .env.local do projeto de DESENVOLVIMENTO. Isto apaga todos os dados.');
  process.exit(1);
}

execFileSync('sh', [path.join(raiz, 'scripts/db.sh'), 'query',
  'truncate table public.itens_exportacao, public.exportacoes, public.anexos, public.lancamentos, public.fornecedores, public.contas_bancarias restart identity cascade'],
  { stdio: 'inherit' });

const { createClient } = createRequire(path.join(raiz, 'package.json'))('@supabase/supabase-js');
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { error } = await db.auth.signInWithPassword({ email: env.E2E_EMAIL, password: env.E2E_SENHA });
if (error) throw error;

async function listar(prefix) {
  const { data, error } = await db.storage.from('anexos').list(prefix, { limit: 1000 });
  if (error) throw error;
  const out = [];
  for (const it of data) {
    const p = prefix ? `${prefix}/${it.name}` : it.name;
    if (it.id) out.push(p);
    else out.push(...(await listar(p)));
  }
  return out;
}
const paths = await listar('');
if (paths.length) {
  const { error: e } = await db.storage.from('anexos').remove(paths);
  if (e) throw e;
}
console.log(`Dados apagados. Objetos removidos do bucket anexos: ${paths.length}.`);

function lerEnv(arquivo) {
  if (!fs.existsSync(arquivo)) return {};
  return Object.fromEntries(
    fs.readFileSync(arquivo, 'utf8').split('\n')
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
  );
}
