import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { situacaoTela } from '@/components/lancamentos/situacao-badge';
import { pendenciasDe } from '@/lib/pendencias';
import { filtrosLancamentosSchema } from '@/lib/validation/lancamentos';
import { listar } from '@/repositories/lancamentos';
import type { Database } from '@/types/database';

describe('situação exibida', () => {
  it.each(['pendente_revisao', 'incompleto', 'exportavel', null])('exibe %s como pendente', (situacao) => {
    expect(situacaoTela(situacao)).toBe('pendente');
  });

  it('só considera completo o estado completo do banco', () => {
    expect(situacaoTela('completo')).toBe('completo');
  });
});

describe('pendências dos dados salvos', () => {
  const completo = {
    revisado_em: '2026-10-06T12:00:00Z',
    fornecedor_id: 'fornecedor',
    data_nota: '2026-10-06',
    valor_centavos: 100,
    numero_nota: '1',
    descricao: 'Papel',
    conta_bancaria_id: 'conta',
  };

  it('aponta os campos vazios que antes pareciam preenchidos', () => {
    expect(pendenciasDe({ ...completo, fornecedor_id: null, data_nota: null, valor_centavos: null }))
      .toEqual(['Fornecedor', 'Data', 'Valor']);
  });

  it('exige revisão mesmo que todos os campos tenham dados', () => {
    expect(pendenciasDe({ ...completo, revisado_em: null })).toEqual(['Revisão']);
  });

  it('considera texto com só espaços como pendência', () => {
    expect(pendenciasDe({ ...completo, numero_nota: ' ', descricao: '\t', conta_bancaria_id: null }))
      .toEqual(['Número da nota', 'Descrição', 'Conta bancária']);
    expect(pendenciasDe(completo)).toEqual([]);
  });
});

describe('filtro e compatibilidade das URLs', () => {
  it.each(['pendente', 'pendente_revisao', 'incompleto', 'exportavel', 'completo'])('aceita o filtro %s', (situacao) => {
    expect(filtrosLancamentosSchema.parse({ situacao }).situacao).toBe(situacao);
  });

  it.each([
    ['pendente', 'neq.completo'],
    ['completo', 'eq.completo'],
    ['pendente_revisao', 'eq.pendente_revisao'],
  ])('envia %s ao Supabase com a condição correta', async (situacao, condicao) => {
    // Exercita o cliente Supabase real, interceptando apenas o transporte HTTP.
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('[]', {
      headers: { 'Content-Type': 'application/json', 'Content-Range': '0-0/0' },
    }));
    const db = createClient<Database>('http://127.0.0.1:54321', 'chave-apenas-do-teste', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch },
    });
    await listar(db, filtrosLancamentosSchema.parse({ situacao }));
    const url = new URL(String(fetch.mock.calls[0]?.[0]));
    expect(url.pathname).toBe('/rest/v1/vw_lancamentos');
    expect(url.searchParams.get('situacao')).toBe(condicao);
  });
});
