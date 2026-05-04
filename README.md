# Conversor de Moedas API - Testes Automatizados

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Mocha](https://img.shields.io/badge/Mocha-11.x-8D6748?logo=mocha&logoColor=white)
![Chai](https://img.shields.io/badge/Chai-6.x-A30701)
![Supertest](https://img.shields.io/badge/Supertest-7.x-2F6FED)
![Mochawesome](https://img.shields.io/badge/Mochawesome-7.x-FF69B4)
![API Tests](https://img.shields.io/badge/API%20Tests-Functional%20%7C%20Business%20%7C%20Performance-success)

## Descricao do Projeto

Este projeto contem uma API REST para conversao de moedas e consulta de cotacoes, acompanhada por uma suite automatizada de testes de API. A aplicacao valida entradas monetarias, calcula conversoes entre moedas suportadas.

O objetivo da suite de testes e garantir precisao financeira, consistencia contratual e resiliencia operacional. Os testes cobrem desde validacao de payloads e regras de conversao ate cenarios de indisponibilidade do provedor de cotacoes e limites de tempo de resposta.

## Stack Tecnologica

| Tecnologia | Uso no projeto |
| --- | --- |
| Node.js | Runtime JavaScript usado para executar a API e os testes automatizados. |
| Express | Framework HTTP responsavel pelos endpoints REST da API. |
| Mocha | Test runner utilizado para organizar e executar as suites de teste. |
| Chai | Biblioteca de assercoes para validar contratos, regras de negocio e respostas HTTP. |
| Supertest | Cliente HTTP para testar os endpoints da API de forma programatica. |
| Mochawesome | Reporter responsavel por gerar relatorios HTML e JSON da execucao dos testes. |
| Swagger UI Express | Exposicao da documentacao Swagger da API. |

## Pre-requisitos

- Node.js 18 ou superior.
- npm 9 ou superior, instalado junto com o Node.js.
- Git para clonar o repositorio.

Para validar as versoes instaladas:

```bash
node --version
npm --version
git --version
```

## Instalacao e Configuracao

1. Clone o repositorio:

```bash
git clone https://github.com/Nayrasz/conversao-moedas
cd conversor-moedas
```

2. Instale as dependencias:

```bash
npm install
```

3. Configure as variaveis de ambiente conforme o cenario de execucao.

Por padrao, os testes usam a aplicacao local importada diretamente de `scr/app.js`. Para testar uma API ja publicada ou uma instancia em execucao, informe a URL base por variavel de ambiente:

```bash
# Linux/macOS
export API_BASE_URL="http://localhost:3000"
export API_SLA_MS="200"
export STRESS_REQUESTS="75"

# Windows PowerShell
$env:API_BASE_URL="http://localhost:3000"
$env:API_SLA_MS="200"
$env:STRESS_REQUESTS="75"
```

Variaveis disponiveis:

| Variavel | Padrao | Descricao |
| --- | --- | --- |
| `API_BASE_URL` | vazio | URL base da API. Quando vazia, os testes usam o app local via Supertest. |
| `API_SLA_MS` | `200` | Tempo maximo esperado para a conversao principal nos testes de performance. |
| `STRESS_REQUESTS` | `75` | Quantidade de requisicoes simultaneas no teste de carga controlada. |

4. Para iniciar a API localmente:

```bash
npm start
```

## Estrutura de Testes

A suite esta dividida por intencao de teste, facilitando manutencao, leitura e execucao seletiva.

### Funcionais

Arquivo: `test/functional.test.mjs`

Valida contrato HTTP, tipos de dados e entradas invalidas. Esta camada cobre casos como valor negativo, valor zero, moeda inexistente, campo obrigatorio ausente, tipo incorreto em campo numerico e schema esperado em uma conversao valida.

### Negocio

Arquivo: `test/business.test.mjs`

Valida regras de conversao e precisao decimal. Esta camada cobre conversao de identidade, preservacao do valor original, taxa `1.0` quando origem e destino sao iguais, arredondamento financeiro e metadados atuais das cotacoes.

### Resiliencia/Performance

Arquivo: `test/performance.test.mjs`

Valida comportamento sob falhas simuladas e limites operacionais. Esta camada cobre mocks de provedor offline, timeout do provedor externo, SLA de tempo de resposta e carga controlada de requisicoes simultaneas.

## Scripts de Execucao

| Comando | Descricao |
| --- | --- |
| `npm start` | Inicia a API localmente. |
| `npm test` | Executa todas as suites e gera relatorio Mochawesome em `mochawesome-report/`. |
| `npm run test:functional` | Executa apenas os testes funcionais. |
| `npm run test:business` | Executa apenas os testes de regras de negocio. |
| `npm run test:performance` | Executa apenas os testes de resiliencia e performance. |

Exemplo de execucao completa:

```bash
npm test
```

Exemplo usando uma API externa:

```bash
API_BASE_URL="https://api.exemplo.com" npm test
```

No Windows PowerShell:

```powershell
$env:API_BASE_URL="https://api.exemplo.com"
npm test
```

## Relatorios

A execucao de `npm test` gera automaticamente um relatorio Mochawesome em:

```text
mochawesome-report/index.html
```

Para visualizar o relatorio, abra o arquivo `mochawesome-report/index.html` no navegador apos a execucao dos testes. O relatorio contem o resumo da execucao, tempo por teste, status das suites e detalhes de falhas quando existirem.

## Estrutura de Pastas

```text
.
|-- docs/
|   |-- swagger.js
|   `-- swagger.json
|-- mochawesome-report/
|   `-- index.html
|-- scr/
|   `-- app.js
|-- test/
|   |-- support/
|   |   |-- assertions.mjs
|   |   `-- config.mjs
|   |-- business.test.mjs
|   |-- functional.test.mjs
|   `-- performance.test.mjs
|-- .gitignore
|-- package-lock.json
|-- package.json
`-- README.md
```

## Documentacao da API

A documentacao Swagger fica disponivel a partir dos arquivos em `docs/`. Ao iniciar a aplicacao, consulte a rota configurada no servidor para acessar a interface Swagger e validar contratos disponiveis.
