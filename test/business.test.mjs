import { expect } from "chai";
import { api, payloadConversao } from "./support/config.mjs";
import { expectDecimalPlacesAtMost, expectIsoDate } from "./support/assertions.mjs";

describe("Conversoes - regras de negocio", () => {
  before(() => {
    process.env.NODE_ENV = "test";
  });

  it("deve manter valor original e taxa 1.0 em conversao de identidade", async () => {
    const response = await api()
      .post("/conversoes")
      .send(payloadConversao({ valor: 123.45, moedaOrigem: "USD", moedaDestino: "USD" }))
      .expect(200);

    // A conversao de uma moeda para ela mesma nao deve alterar valor nem aplicar spread.
    expect(response.body.valorOriginal).to.equal(123.45);
    expect(response.body.valorConvertido).to.equal(123.45);
    expect(response.body.cotacaoUtilizada).to.equal(1.0);
  });

  it("deve respeitar precisao financeira no valor convertido e na taxa", async () => {
    const response = await api().post("/conversoes").send(payloadConversao()).expect(200);

    // BRL -> USD usa moeda de destino com duas casas e taxa demonstrativa com ate quatro casas.
    expect(response.body.valorConvertido).to.equal(49.17);
    expectDecimalPlacesAtMost(response.body.valorConvertido, 2);
    expectDecimalPlacesAtMost(response.body.cotacaoUtilizada, 4);
  });

  it("deve expor cotacoes com metadados atuais de fonte e data", async () => {
    const inicio = Date.now();
    const response = await api()
      .get("/cotacoes")
      .query({ moedaOrigem: "BRL", moedaDestino: "USD" })
      .expect(200);

    const [cotacao] = response.body.cotacoes;

    // Garante que o GET /cotacoes reflita a fonte usada e uma data de cotacao gerada na consulta.
    expect(response.body.dataReferencia).to.match(/^\d{4}-\d{2}-\d{2}$/);
    expect(cotacao).to.include({ moedaOrigem: "BRL", moedaDestino: "USD", taxa: 0.1961 });
    expect(cotacao.fonte).to.be.a("string").and.not.empty;
    expectIsoDate(cotacao.dataHoraCotacao);
    expect(Date.parse(cotacao.dataHoraCotacao)).to.be.at.least(inicio);
  });
});
