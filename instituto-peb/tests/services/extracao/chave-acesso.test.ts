import { describe, expect, it } from 'vitest';
import { decomporChave, encontrarChaveEmTexto, validarChave } from '@/services/extracao/chave-acesso';

// Chave real de exemplo da documentação da NF-e (DV correto).
const CHAVE = '35200714200166000187550010000000191234567890';
// Ajuste do DV para a chave acima: calculamos para garantir consistência do teste.
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
const VALIDA = comDv(CHAVE.slice(0, 43));

describe('validarChave', () => {
  it('aceita chave com DV correto e rejeita alterada', () => {
    expect(validarChave(VALIDA)).toBe(true);
    const errada = VALIDA.slice(0, 43) + String((Number(VALIDA[43]) + 1) % 10);
    expect(validarChave(errada)).toBe(false);
    expect(validarChave('123')).toBe(false);
  });
});

describe('decomporChave', () => {
  it('extrai CNPJ, série e número sem zeros à esquerda', () => {
    const d = decomporChave(VALIDA);
    expect(d?.cnpj).toBe('14200166000187');
    expect(d?.modelo).toBe('55');
    expect(d?.serie).toBe('1');
    expect(d?.numero).toBe('19');
  });
});

describe('encontrarChaveEmTexto', () => {
  it('acha a chave impressa em grupos de 4', () => {
    const impressa = VALIDA.replace(/(\d{4})(?=\d)/g, '$1 ');
    const texto = `DANFE\nCHAVE DE ACESSO\n${impressa}\nConsulta de autenticidade`;
    expect(encontrarChaveEmTexto(texto)).toBe(VALIDA);
  });
  it('devolve null quando não há chave válida', () => {
    expect(encontrarChaveEmTexto('nota fiscal 12345 valor 10,00')).toBeNull();
  });
});
