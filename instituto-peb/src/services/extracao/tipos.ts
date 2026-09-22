/**
 * O que a leitura automática encontrou num arquivo. Tudo opcional: o que
 * não foi achado simplesmente não aparece. Vai para anexos.dados_extraidos.
 */
export type DadosExtraidos = {
  fonte: 'xml' | 'pdf';
  /** Chave de acesso da NF-e, 44 dígitos. */
  chave?: string;
  /** Número da nota, sem zeros à esquerda. */
  numero?: string;
  serie?: string;
  /** Data de emissão em ISO AAAA-MM-DD. */
  emissao?: string;
  valor_centavos?: number;
  /** CPF/CNPJ do emitente, normalizado. */
  cnpj_emitente?: string;
  nome_emitente?: string;
};

export function temAlgumDado(d: DadosExtraidos | null): d is DadosExtraidos {
  if (!d) return false;
  return Object.keys(d).some((k) => k !== 'fonte' && d[k as keyof DadosExtraidos] !== undefined);
}
