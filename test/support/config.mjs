import app from "../../scr/app.js";
import request from "supertest";

export const config = {
  baseUrl: process.env.API_BASE_URL || "",
  slaMs: Number(process.env.API_SLA_MS || 200),
  stressRequests: Number(process.env.STRESS_REQUESTS || 75)
};

export function api() {
  return config.baseUrl ? request(config.baseUrl) : request(app);
}

export function payloadConversao(overrides = {}) {
  return {
    valor: 250.75,
    moedaOrigem: "BRL",
    moedaDestino: "USD",
    ...overrides
  };
}
