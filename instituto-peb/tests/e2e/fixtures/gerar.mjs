// Gera os arquivos usados pelo teste de ponta a ponta: XML de NF-e com chave
// válida, DANFE em PDF mínimo com texto selecionável e um PNG de 1 pixel.
// Uso: node tests/e2e/fixtures/gerar.mjs  (os arquivos saem nesta pasta)
import fs from 'node:fs';
import path from 'node:path';

const dir = path.dirname(new URL(import.meta.url).pathname);

function comDv(base43) {
  let s = 0;
  let p = 2;
  for (let i = 42; i >= 0; i--) {
    s += Number(base43[i]) * p;
    p = p === 9 ? 2 : p + 1;
  }
  const r = s % 11;
  return base43 + String(r < 2 ? 0 : 11 - r);
}

export const CNPJ = '14200166000166'; // dígitos verificadores válidos
export const EMITENTE = 'Papelaria Teste Ltda';
export const CHAVE = comDv('3220' + '09' + CNPJ + '55' + '001' + '000004567' + '1' + '23456789');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe${CHAVE}" versao="4.00">
      <ide><cUF>32</cUF><nNF>4567</nNF><serie>1</serie><dhEmi>2026-09-03T10:15:00-03:00</dhEmi><mod>55</mod></ide>
      <emit><CNPJ>${CNPJ}</CNPJ><xNome>${EMITENTE}</xNome></emit>
      <total><ICMSTot><vNF>1234.56</vNF></ICMSTot></total>
    </infNFe>
  </NFe>
</nfeProc>`;

const texto = `DANFE  CHAVE DE ACESSO ${CHAVE.replace(/(\d{4})(?=\d)/g, '$1 ')}  DATA DE EMISSAO 03/09/2026  VALOR TOTAL DA NOTA 1.234,56`;
const stream = `BT /F1 10 Tf 20 750 Td (${texto}) Tj ET`;
const objs = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
  `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
];
let pdf = '%PDF-1.4\n';
const offs = [];
objs.forEach((o, i) => {
  offs.push(Buffer.byteLength(pdf));
  pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf);
pdf +=
  `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` +
  offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('') +
  `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

export function gerar() {
  fs.writeFileSync(path.join(dir, 'nfe.xml'), xml);
  fs.writeFileSync(path.join(dir, 'danfe.pdf'), pdf, 'binary');
  fs.writeFileSync(path.join(dir, 'comprovante.png'), png);
  return dir;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log('fixtures em', gerar());
}
