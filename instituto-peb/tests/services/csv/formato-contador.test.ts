import { describe, expect, it } from 'vitest';
import { FORMATO, escapar, gerarCsv, type LinhaCsv } from '@/services/csv/formato-contador';

const linha: LinhaCsv = {
  data_nota: '2026-09-01',
  fornecedor_nome: 'Papelaria; Central',
  fornecedor_documento: '14200166000187',
  numero_nota: '19',
  serie_nota: '1',
  descricao: 'Resmas "A4"',
  conta_bancaria_nome: null,
  valor_centavos: 123456,
  pendencias: ['Conta bancária'],
  arquivos: ['001_papelaria-central_NF19.pdf'],
};

describe('gerarCsv', () => {
  it('gera BOM, cabeçalho, separador ; e CRLF, com escape', () => {
    const csv = gerarCsv([linha]);
    expect(csv.startsWith(FORMATO.bom)).toBe(true);
    const linhas = csv.slice(1).split('\r\n');
    expect(linhas[0]).toBe('Data;Fornecedor;CPF/CNPJ;Numero NF;Serie;Descricao;Conta bancaria;Valor;Pendencias;Arquivos');
    expect(linhas[1]).toBe('01/09/2026;"Papelaria; Central";14.200.166/0001-87;19;1;"Resmas ""A4""";;1.234,56;Conta bancária;001_papelaria-central_NF19.pdf');
    expect(linhas[2]).toBe('');
  });
});

describe('escapar', () => {
  it('só põe aspas quando precisa', () => {
    expect(escapar('abc')).toBe('abc');
    expect(escapar('a;b')).toBe('"a;b"');
    expect(escapar('a\nb')).toBe('"a\nb"');
    expect(escapar('')).toBe('');
  });
});
