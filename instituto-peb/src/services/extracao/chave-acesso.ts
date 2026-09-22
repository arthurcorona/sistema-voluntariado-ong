/**
 * Chave de acesso da NF-e/NFC-e: 44 dígitos.
 *   cUF(2) AAMM(4) CNPJ(14) mod(2) serie(3) nNF(9) tpEmis(1) cNF(8) DV(1)
 */

export type ChaveDecomposta = {
  chave: string;
  uf: string;
  aamm: string;
  cnpj: string;
  modelo: string;
  serie: string;
  numero: string;
};

export function validarChave(chave: string): boolean {
  if (!/^\d{44}$/.test(chave)) return false;
  let soma = 0;
  let peso = 2;
  for (let i = 42; i >= 0; i--) {
    soma += Number(chave[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;
  return dv === Number(chave[43]);
}

export function decomporChave(chave: string): ChaveDecomposta | null {
  if (!validarChave(chave)) return null;
  return {
    chave,
    uf: chave.slice(0, 2),
    aamm: chave.slice(2, 6),
    cnpj: chave.slice(6, 20),
    modelo: chave.slice(20, 22),
    serie: String(Number(chave.slice(22, 25))),
    numero: String(Number(chave.slice(25, 34))),
  };
}

/**
 * Procura uma chave válida num texto qualquer (DANFE costuma imprimir em
 * grupos de 4 separados por espaço). Devolve a primeira válida.
 */
export function encontrarChaveEmTexto(texto: string): string | null {
  // Sequências de dígitos com espaços/pontos entre grupos.
  const re = /(?:\d[\s.]?){44,60}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    const digitos = m[0].replace(/\D/g, '');
    // Janela deslizante: o trecho pode ter dígitos vizinhos colados.
    for (let i = 0; i + 44 <= digitos.length; i++) {
      const c = digitos.slice(i, i + 44);
      if (validarChave(c)) return c;
    }
  }
  return null;
}
