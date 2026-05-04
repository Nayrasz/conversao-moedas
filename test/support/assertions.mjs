import { expect } from "chai";

export function expectIsoDate(value) {
  // Garante que datas do contrato sejam serializadas em formato ISO-8601 valido.
  expect(value).to.be.a("string");
  expect(Number.isNaN(Date.parse(value))).to.equal(false);
}

export function expectErrorBody(body, expectedCode, expectedField) {
  // Confirma que a API devolve um erro padronizado e rastreavel por codigo estavel.
  expect(body).to.include.keys("codigo", "mensagem", "dataHora");
  expect(body.codigo).to.equal(expectedCode);
  expect(body.mensagem).to.be.a("string").and.not.empty;
  expectIsoDate(body.dataHora);

  if (expectedField) {
    // Valida que o campo rejeitado aparece nos detalhes para facilitar diagnostico do consumidor.
    expect(body.detalhes).to.be.an("array").and.not.empty;
    expect(body.detalhes.some((detalhe) => detalhe.campo === expectedField)).to.equal(true);
  }
}

export function decimalPlaces(value) {
  const [, decimal = ""] = String(value).split(".");
  return decimal.length;
}

export function expectDecimalPlacesAtMost(value, limit) {
  // Protege o padrao financeiro esperado, evitando retornos com excesso de casas decimais.
  expect(value).to.be.a("number");
  expect(decimalPlaces(value)).to.be.at.most(limit);
}
