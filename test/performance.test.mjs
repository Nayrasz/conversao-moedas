import { expect } from "chai";
import { api, config, payloadConversao } from "./support/config.mjs";
import { expectErrorBody } from "./support/assertions.mjs";

describe("Conversoes - resiliencia e performance", () => {
  before(() => {
    process.env.NODE_ENV = "test";
  });

  it("deve retornar 503 quando a fonte externa estiver offline", async () => {
    const response = await api()
      .get("/cotacoes")
      .set("x-mock-rate-provider", "offline")
      .expect(503);

    // Simula indisponibilidade do provedor para validar fallback HTTP esperado.
    expectErrorBody(response.body, "PROVEDOR_INDISPONIVEL");
  });

  it("deve retornar 504 quando a fonte externa exceder timeout", async () => {
    const response = await api()
      .get("/cotacoes")
      .set("x-mock-rate-provider", "timeout")
      .expect(504);

    // Separa timeout de indisponibilidade generica para facilitar observabilidade.
    expectErrorBody(response.body, "TIMEOUT_PROVEDOR");
  });

  it("deve responder abaixo do SLA configurado", async () => {
    const inicio = Date.now();

    await api().post("/conversoes").send(payloadConversao()).expect(200);

    const duracaoMs = Date.now() - inicio;

    // Mantem a conversao principal dentro do SLA de latencia definido para a API.
    expect(duracaoMs).to.be.below(config.slaMs);
  });

  it("deve suportar carga controlada de requisicoes simultaneas", async function () {
    this.timeout(10000);

    const requisicoes = Array.from({ length: config.stressRequests }, (_, index) => {
      return api()
        .post("/conversoes")
        .send(payloadConversao({ valor: 100 + index }));
    });

    const respostas = await Promise.all(requisicoes);

    // Confirma que todas as chamadas concorrentes completam com sucesso e payload consistente.
    expect(respostas).to.have.length(config.stressRequests);
    respostas.forEach((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.include.keys("valorOriginal", "valorConvertido", "cotacaoUtilizada");
    });
  });
});
