import { describe, expect, it } from 'vitest';
import { decimalParaCentavos, extrairDeXml } from '@/services/extracao/nfe-xml';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe35200714200166000187550010000000191234567890" versao="4.00">
      <ide><cUF>35</cUF><nNF>000000019</nNF><serie>1</serie><dhEmi>2026-09-01T10:15:00-03:00</dhEmi><mod>55</mod></ide>
      <emit><CNPJ>14200166000187</CNPJ><xNome>Papelaria Central Ltda</xNome></emit>
      <total><ICMSTot><vNF>1234.56</vNF></ICMSTot></total>
    </infNFe>
  </NFe>
</nfeProc>`;

describe('extrairDeXml', () => {
  it('lê número, série, emissão, valor, CNPJ e nome do emitente', () => {
    const d = extrairDeXml(XML);
    expect(d).toMatchObject({
      fonte: 'xml',
      chave: '35200714200166000187550010000000191234567890',
      numero: '19',
      serie: '1',
      emissao: '2026-09-01',
      valor_centavos: 123456,
      cnpj_emitente: '14200166000187',
      nome_emitente: 'Papelaria Central Ltda',
    });
  });

  it('aceita NFe sem nfeProc', () => {
    const semProc = XML.replace(/<\/?nfeProc[^>]*>/g, '');
    expect(extrairDeXml(semProc)?.numero).toBe('19');
  });

  it('devolve null para XML que não é NF-e', () => {
    expect(extrairDeXml('<pedido><id>1</id></pedido>')).toBeNull();
    expect(extrairDeXml('isso não é xml')).toBeNull();
  });
});

describe('decimalParaCentavos', () => {
  it('converte texto decimal do XML', () => {
    expect(decimalParaCentavos('1234.56')).toBe(123456);
    expect(decimalParaCentavos('10')).toBe(1000);
    expect(decimalParaCentavos('0.5')).toBe(50);
    expect(decimalParaCentavos('1.005')).toBe(101);
    expect(decimalParaCentavos('abc')).toBeNull();
  });
});
