/**
 * CPF e CNPJ: normalização, validação (dígitos verificadores) e formatação.
 * CNPJ aceita o formato alfanumérico vigente desde julho de 2026:
 * 12 caracteres [A-Z0-9] + 2 dígitos verificadores numéricos.
 */

export type TipoDocumento = 'cpf' | 'cnpj';

/** Remove pontuação e espaços; letras ficam maiúsculas. */
export function normalizarDocumento(input: string): string {
  return input.replace(/[.\-\/\s]/g, '').toUpperCase();
}

export function tipoDocumento(normalizado: string): TipoDocumento | null {
  if (/^\d{11}$/.test(normalizado)) return 'cpf';
  if (/^[A-Z0-9]{12}\d{2}$/.test(normalizado)) return 'cnpj';
  return null;
}

export function validarCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const dv = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(cpf[9]) && dv(10) === Number(cpf[10]);
}

export function validarCnpj(cnpj: string): boolean {
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj)) return false;
  if (/^(.)\1{13}$/.test(cnpj)) return false;
  const val = (c: string) => c.charCodeAt(0) - 48; // '0'..'9' → 0..9, 'A'..'Z' → 17..42
  const dv = (base: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += val(base[i]) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = dv(cnpj.slice(0, 12), w1);
  const d2 = dv(cnpj.slice(0, 12) + String(d1), w2);
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

/** Valida CPF ou CNPJ já normalizado. */
export function validarDocumento(normalizado: string): boolean {
  const tipo = tipoDocumento(normalizado);
  if (tipo === 'cpf') return validarCpf(normalizado);
  if (tipo === 'cnpj') return validarCnpj(normalizado);
  return false;
}

/** "12345678000199" → "12.345.678/0001-99"; "12345678909" → "123.456.789-09". */
export function formatarDocumento(normalizado: string | null | undefined): string {
  if (!normalizado) return '';
  const tipo = tipoDocumento(normalizado);
  if (tipo === 'cpf') {
    return normalizado.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  if (tipo === 'cnpj') {
    return normalizado.replace(/^(.{2})(.{3})(.{3})(.{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  return normalizado;
}
