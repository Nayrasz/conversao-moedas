import { expect } from "chai";
import { api, payloadConversao } from "./support/config.mjs";
import { expectErrorBody, expectIsoDate } from "./support/assertions.mjs";

describe("Conversoes - validacao de dados e contrato", () => {
  before(() => {
    process.env.NODE_ENV = "test";
  });

  it("deve rejeitar valor negativo com 400 Bad Request", async () => {
    const response = await api()
      .post("/conversoes")
      .send(payloadConversao({ valor: -150.0 }))
      .expect(400);

    // Verifica status semantico e codigo de erro para entradas monetarias invalidas.
    expectErrorBody(response.body, "VALOR_INVALIDO", "valor");
  });

  it("deve rejeitar valor zero como entrada invalida", async () => {
    const response = await api()
      .post("/conversoes")
      .send(payloadConversao({ valor: 0 }))
      .expect(400);

    // Garante que zero nao seja tratado como conversao valida nem gere cotacao artificial.
    expectErrorBody(response.body, "VALOR_INVALIDO", "valor");
  });

  it("deve rejeitar moeda inexistente com mensagem explicativa", async () => {
    const response = await api()
      .post("/conversoes")
      .send(payloadConversao({ moedaDestino: "XYZ" }))
      .expect(400);

    // Confirma que o consumidor recebe orientacao clara sobre os codigos aceitos.
    expectErrorBody(response.body, "MOEDA_INVALIDA");
    expect(JSON.stringify(response.body.detalhes)).to.include("BRL, USD, EUR ou JPY");
  });

  it("deve rejeitar campo obrigatorio ausente no payload", async () => {
    const payload = payloadConversao();
    delete payload.moedaDestino;

    const response = await api().post("/conversoes").send(payload).expect(400);

    // Valida contrato minimo: moedaDestino e obrigatoria para calcular o par de conversao.
    expectErrorBody(response.body, "CAMPO_INVALIDO", "moedaDestino");
  });

  it("deve rejeitar tipo incorreto em campo numerico", async () => {
    const response = await api()
      .post("/conversoes")
      .send(payloadConversao({ valor: "150.00" }))
      .expect(400);

    // Protege a API contra coercao implicita de string para numero.
    expectErrorBody(response.body, "VALOR_INVALIDO", "valor");
  });

  it("deve retornar o schema esperado em uma conversao valida", async () => {
    const response = await api().post("/conversoes").send(payloadConversao()).expect(200);

    // Confirma campos obrigatorios e tipos principais do contrato de sucesso.
    expect(response.body).to.include.keys(
      "valorOriginal",
      "moedaOrigem",
      "moedaDestino",
      "cotacaoUtilizada",
      "valorConvertido",
      "dataHoraCotacao",
      "dataHoraConversao"
    );
    expect(response.body.valorOriginal).to.be.a("number");
    expect(response.body.cotacaoUtilizada).to.be.a("number");
    expect(response.body.valorConvertido).to.be.a("number");
    expectIsoDate(response.body.dataHoraCotacao);
    expectIsoDate(response.body.dataHoraConversao);
  });
});
