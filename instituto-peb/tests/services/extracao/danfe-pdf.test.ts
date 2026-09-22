import { describe, expect, it } from 'vitest';
import { extrairDeTextoDanfe } from '@/services/extracao/danfe-pdf';

function comDv(base43: string): string {
  let soma = 0;
  let peso = 2;
  for (let i = 42; i >= 0; i--) {
    soma += Number(base43[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const r = soma % 11;
  return base43 + String(r < 2 ? 0 : 11 - r);
}
const CHAVE = comDv('3520071420016600018755001000000019123456789');

describe('extrairDeTextoDanfe', () => {
  it('extrai chave, e heurísticas de valor e data quando os rótulos existem', () => {
    const texto = `DANFE Documento Auxiliar
      CHAVE DE ACESSO ${CHAVE.replace(/(\d{4})(?=\d)/g, '$1 ')}
      DATA DE EMISSÃO 01/09/2026
      VALOR TOTAL DOS PRODUTOS 1.200,00 VALOR TOTAL DA NOTA 1.234,56`;
    const d = extrairDeTextoDanfe(texto);
    expect(d?.chave).toBe(CHAVE);
    expect(d?.cnpj_emitente).toBe('14200166000187');
    expect(d?.numero).toBe('19');
    expect(d?.valor_centavos).toBe(123456);
    expect(d?.emissao).toBe('2026-09-01');
  });

  it('devolve null sem chave (nota de serviço, comprovante etc.)', () => {
    expect(extrairDeTextoDanfe('NFS-e Prefeitura de Serra valor 500,00')).toBeNull();
  });
});
