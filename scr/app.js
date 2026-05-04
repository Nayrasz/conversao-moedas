const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../docs/swagger.json");

const app = express();
const port = process.env.PORT || 8000;

const moedas = [
  { codigo: "BRL", nome: "Real brasileiro", simbolo: "R$", casasDecimais: 2 },
  { codigo: "USD", nome: "Dolar americano", simbolo: "$", casasDecimais: 2 },
  { codigo: "EUR", nome: "Euro", simbolo: "€", casasDecimais: 2 },
  { codigo: "JPY", nome: "Iene japones", simbolo: "¥", casasDecimais: 0 }
];

const cotacoes = [
  { moedaOrigem: "BRL", moedaDestino: "USD", taxa: 0.1961 },
  { moedaOrigem: "BRL", moedaDestino: "EUR", taxa: 0.1818 },
  { moedaOrigem: "BRL", moedaDestino: "JPY", taxa: 30.82 },
  { moedaOrigem: "USD", moedaDestino: "BRL", taxa: 5.0994 },
  { moedaOrigem: "USD", moedaDestino: "EUR", taxa: 0.9270 },
  { moedaOrigem: "USD", moedaDestino: "JPY", taxa: 157.18 },
  { moedaOrigem: "EUR", moedaDestino: "BRL", taxa: 5.5005 },
  { moedaOrigem: "EUR", moedaDestino: "USD", taxa: 1.0787 },
  { moedaOrigem: "EUR", moedaDestino: "JPY", taxa: 169.56 },
  { moedaOrigem: "JPY", moedaDestino: "BRL", taxa: 0.0324 },
  { moedaOrigem: "JPY", moedaDestino: "USD", taxa: 0.0064 },
  { moedaOrigem: "JPY", moedaDestino: "EUR", taxa: 0.0059 }
];

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res, next) => {
  const falhaSimulada = req.get("x-mock-rate-provider");

  if (process.env.NODE_ENV === "test" && falhaSimulada === "offline") {
    return res
      .status(503)
      .json(criarErro("PROVEDOR_INDISPONIVEL", "Nao foi possivel consultar a fonte externa de cotacoes."));
  }

  if (process.env.NODE_ENV === "test" && falhaSimulada === "timeout") {
    return res
      .status(504)
      .json(criarErro("TIMEOUT_PROVEDOR", "A fonte externa de cotacoes excedeu o tempo limite de resposta."));
  }

  next();
});

function dataHoraAtual() {
  return new Date().toISOString();
}

function criarErro(codigo, mensagem, detalhes) {
  return {
    codigo,
    mensagem,
    ...(detalhes ? { detalhes } : {}),
    dataHora: dataHoraAtual()
  };
}

function moedaValida(codigo) {
  return moedas.some((moeda) => moeda.codigo === codigo);
}

function encontrarCotacao(moedaOrigem, moedaDestino) {
  return cotacoes.find(
    (cotacao) =>
      cotacao.moedaOrigem === moedaOrigem && cotacao.moedaDestino === moedaDestino
  );
}

function formatarCotacao(cotacao) {
  return {
    ...cotacao,
    dataHoraCotacao: dataHoraAtual(),
    fonte: "Cotacoes demonstrativas"
  };
}

app.get("/", (req, res) => {
  res.send(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Conversor de Moedas</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Arial, Helvetica, sans-serif;
      background: #f4f7f6;
      color: #17211f;
      display: grid;
      place-items: center;
      padding: 24px;
    }

    main {
      width: min(100%, 620px);
      background: #ffffff;
      border: 1px solid #d9e2df;
      border-radius: 8px;
      padding: 28px;
      box-shadow: 0 12px 32px rgba(23, 33, 31, 0.08);
    }

    h1 {
      margin: 0 0 8px;
      font-size: 28px;
      line-height: 1.2;
    }

    p {
      margin: 0 0 24px;
      color: #52615d;
      line-height: 1.5;
    }

    form {
      display: grid;
      gap: 16px;
    }

    label {
      display: grid;
      gap: 8px;
      font-weight: 700;
    }

    input,
    select,
    button {
      width: 100%;
      min-height: 44px;
      border-radius: 6px;
      font: inherit;
    }

    input,
    select {
      border: 1px solid #b9c7c3;
      padding: 10px 12px;
      background: #ffffff;
      color: #17211f;
    }

    .linha {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    button {
      border: 0;
      background: #176b5b;
      color: #ffffff;
      font-weight: 700;
      cursor: pointer;
    }

    button:hover {
      background: #12584b;
    }

    #resultado {
      margin-top: 20px;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #d9e2df;
      background: #f8fbfa;
      min-height: 84px;
      line-height: 1.5;
    }

    .valor-convertido {
      display: block;
      margin-top: 4px;
      font-size: 26px;
      font-weight: 700;
      color: #176b5b;
    }

    .erro {
      color: #a33434;
      font-weight: 700;
    }

    .links {
      display: flex;
      gap: 12px;
      margin-top: 18px;
      flex-wrap: wrap;
    }

    .links a {
      color: #176b5b;
      font-weight: 700;
      text-decoration: none;
    }

    @media (max-width: 520px) {
      main {
        padding: 22px;
      }

      .linha {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main>
    <h1>Conversor de Moedas</h1>
    <p>Digite o valor de origem, escolha a moeda dele e selecione para qual moeda deseja converter.</p>

    <form id="form-conversao">
      <label>
        Valor de origem
        <input id="valor" name="valor" type="text" inputmode="decimal" value="5000" placeholder="Ex: 5000" required>
      </label>

      <div class="linha">
        <label>
          De
          <select id="moedaOrigem" name="moedaOrigem">
            <option value="JPY" selected>JPY - Iene japones</option>
            <option value="BRL">BRL - Real brasileiro</option>
            <option value="USD">USD - Dolar americano</option>
            <option value="EUR">EUR - Euro</option>
          </select>
        </label>

        <label>
          Para
          <select id="moedaDestino" name="moedaDestino">
            <option value="BRL" selected>BRL - Real brasileiro</option>
            <option value="JPY">JPY - Iene japones</option>
            <option value="USD">USD - Dolar americano</option>
            <option value="EUR">EUR - Euro</option>
          </select>
        </label>
      </div>

      <button type="submit">Converter</button>
    </form>

    <section id="resultado" aria-live="polite">
      Informe o valor de origem e clique em converter.
    </section>

    <nav class="links" aria-label="Links da API">
      <a href="/docs">Swagger</a>
      <a href="/cotacoes">Cotacoes</a>
      <a href="/moedas">Moedas</a>
    </nav>
  </main>

  <script>
    const form = document.getElementById("form-conversao");
    const resultado = document.getElementById("resultado");

    function converterTextoParaNumero(texto) {
      const limpo = texto.trim().replace(/\\s/g, "");
      const temVirgula = limpo.includes(",");
      const normalizado = temVirgula
        ? limpo.replace(/\\./g, "").replace(",", ".")
        : limpo.replace(/\\./g, "");

      return Number(normalizado);
    }

    function formatarMoeda(valor, moeda) {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: moeda
      }).format(valor);
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const valor = converterTextoParaNumero(document.getElementById("valor").value);
      const moedaOrigem = document.getElementById("moedaOrigem").value;
      const moedaDestino = document.getElementById("moedaDestino").value;

      if (!Number.isFinite(valor) || valor <= 0) {
        resultado.innerHTML = '<span class="erro">Informe um valor maior que zero.</span>';
        return;
      }

      resultado.textContent = "Convertendo...";

      try {
        const resposta = await fetch("/conversoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valor, moedaOrigem, moedaDestino })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          resultado.innerHTML = '<span class="erro">' + dados.mensagem + '</span>';
          return;
        }

        resultado.innerHTML =
          formatarMoeda(dados.valorOriginal, dados.moedaOrigem) +
          " equivalem a" +
          '<span class="valor-convertido">' +
          formatarMoeda(dados.valorConvertido, dados.moedaDestino) +
          "</span>";
      } catch (erro) {
        resultado.innerHTML = '<span class="erro">Nao foi possivel realizar a conversao.</span>';
      }
    });
  </script>
</body>
</html>`);
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    versao: swaggerDocument.info.version,
    dataHora: dataHoraAtual()
  });
});

app.get("/moedas", (req, res) => {
  res.json({ moedas });
});

app.get("/cotacoes", (req, res) => {
  const { moedaOrigem, moedaDestino } = req.query;

  if (moedaOrigem && !moedaValida(moedaOrigem)) {
    return res.status(400).json(
      criarErro("MOEDA_INVALIDA", "A moeda de origem informada nao e suportada.", [
        {
          campo: "moedaOrigem",
          mensagem: "Use uma das moedas permitidas: BRL, USD, EUR ou JPY."
        }
      ])
    );
  }

  if (moedaDestino && !moedaValida(moedaDestino)) {
    return res.status(400).json(
      criarErro("MOEDA_INVALIDA", "A moeda de destino informada nao e suportada.", [
        {
          campo: "moedaDestino",
          mensagem: "Use uma das moedas permitidas: BRL, USD, EUR ou JPY."
        }
      ])
    );
  }

  const cotacoesFiltradas = cotacoes.filter((cotacao) => {
    return (
      (!moedaOrigem || cotacao.moedaOrigem === moedaOrigem) &&
      (!moedaDestino || cotacao.moedaDestino === moedaDestino)
    );
  });

  if (cotacoesFiltradas.length === 0) {
    return res
      .status(404)
      .json(
        criarErro(
          "COTACAO_NAO_ENCONTRADA",
          "Nao foi encontrada cotacao disponivel para os filtros informados."
        )
      );
  }

  res.json({
    dataReferencia: new Date().toISOString().slice(0, 10),
    moedaBasePadrao: "BRL",
    cotacoes: cotacoesFiltradas.map(formatarCotacao)
  });
});

app.get("/cotacoes/:moedaOrigem/:moedaDestino", (req, res) => {
  const { moedaOrigem, moedaDestino } = req.params;

  if (!moedaValida(moedaOrigem) || !moedaValida(moedaDestino)) {
    return res.status(400).json(
      criarErro("MOEDA_INVALIDA", "Uma ou mais moedas informadas nao sao suportadas.", [
        {
          campo: "moedaOrigem/moedaDestino",
          mensagem: "Use uma das moedas permitidas: BRL, USD, EUR ou JPY."
        }
      ])
    );
  }

  const cotacao = encontrarCotacao(moedaOrigem, moedaDestino);

  if (!cotacao) {
    return res
      .status(404)
      .json(
        criarErro(
          "COTACAO_NAO_ENCONTRADA",
          "Nao foi encontrada cotacao disponivel para o par de moedas informado."
        )
      );
  }

  res.json(formatarCotacao(cotacao));
});

app.post("/conversoes", (req, res) => {
  const { valor, moedaOrigem, moedaDestino } = req.body;

  if (typeof valor !== "number" || valor <= 0) {
    return res.status(400).json(
      criarErro("VALOR_INVALIDO", "O valor a converter deve ser maior que zero.", [
        { campo: "valor", mensagem: "Informe um numero positivo." }
      ])
    );
  }

  if (typeof moedaOrigem !== "string") {
    return res.status(400).json(
      criarErro("CAMPO_INVALIDO", "A moeda de origem e obrigatoria e deve ser textual.", [
        { campo: "moedaOrigem", mensagem: "Informe um codigo ISO 4217 valido." }
      ])
    );
  }

  if (typeof moedaDestino !== "string") {
    return res.status(400).json(
      criarErro("CAMPO_INVALIDO", "A moeda de destino e obrigatoria e deve ser textual.", [
        { campo: "moedaDestino", mensagem: "Informe um codigo ISO 4217 valido." }
      ])
    );
  }

  if (!moedaValida(moedaOrigem) || !moedaValida(moedaDestino)) {
    return res.status(400).json(
      criarErro("MOEDA_INVALIDA", "Uma ou mais moedas informadas nao sao suportadas.", [
        {
          campo: "moedaOrigem/moedaDestino",
          mensagem: "Use uma das moedas permitidas: BRL, USD, EUR ou JPY."
        }
      ])
    );
  }

  if (moedaOrigem === moedaDestino) {
    return res.json({
      valorOriginal: valor,
      moedaOrigem,
      moedaDestino,
      cotacaoUtilizada: 1.0,
      valorConvertido: valor,
      dataHoraCotacao: dataHoraAtual(),
      dataHoraConversao: dataHoraAtual()
    });
  }

  const cotacao = encontrarCotacao(moedaOrigem, moedaDestino);

  if (!cotacao) {
    return res
      .status(404)
      .json(
        criarErro(
          "COTACAO_NAO_ENCONTRADA",
          "Nao foi encontrada cotacao disponivel para o par de moedas informado."
        )
      );
  }

  const moedaDestinoDados = moedas.find((moeda) => moeda.codigo === moedaDestino);
  const fatorArredondamento = 10 ** moedaDestinoDados.casasDecimais;
  const valorConvertido =
    Math.round(valor * cotacao.taxa * fatorArredondamento) / fatorArredondamento;

  res.json({
    valorOriginal: valor,
    moedaOrigem,
    moedaDestino,
    cotacaoUtilizada: cotacao.taxa,
    valorConvertido,
    dataHoraCotacao: dataHoraAtual(),
    dataHoraConversao: dataHoraAtual()
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(`Swagger UI disponivel em http://localhost:${port}/docs`);
  });
}

module.exports = app;
