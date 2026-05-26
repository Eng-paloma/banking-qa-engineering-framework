# QA Digital Bank Lab

Framework profissional de QA Engineering para simular testes em um banco digital minimalista (Fake Bank), cobrindo qualidade funcional, segurança, performance e acessibilidade.

## 🎯 Objetivo do projeto

Validar um sistema bancário com foco em:
- Autenticação e autorização
- Transferências financeiras e integridade de saldo
- Segurança baseada em OWASP
- Performance em cenários de alta concorrência
- Acessibilidade com critérios WCAG básicos

## 🏗️ Arquitetura utilizada

- **Page Object Model (POM)** para UI (`pages/`)
- **Service Layer** para API (`services/`)
- **Factory Pattern** para massa de teste (`factories/`)
- **Builder Pattern** para cenários complexos de transferência (`builders/`)
- **Separação por tipo de teste** (`tests/ui`, `tests/api`, `tests/security`, `tests/performance`, `tests/accessibility`)

## 📁 Estrutura

```text
qa-digital-bank-lab/
├── pages/
├── services/
├── builders/
├── factories/
├── tests/
│   ├── ui/
│   ├── api/
│   ├── security/
│   ├── performance/
│   └── accessibility/
├── mock/
│   ├── bank-server.js
│   └── public/
├── k6/
├── zap/
├── playwright.config.ts
├── package.json
└── README.md
```

## ✅ Cenários cobertos

### Segurança
- SQL Injection no login deve falhar
- Token inválido deve retornar `401`
- Brute force deve retornar `429`

### Regras bancárias
- Transferência com sucesso
- Transferência com saldo insuficiente
- Transferência com valor inválido
- Prevenção de double spending

### API Contract
- Validação de schema da resposta de conta
- Consistência de saldo após transações

### Performance
- Carga concorrente de transferências com K6
- Thresholds de latência e taxa de erro

### Acessibilidade
- Labels e nomes acessíveis na tela de login
- Navegação por teclado
- Verificação automatizada com axe-core

## Banking Risk Scenarios Covered

- **Account Takeover Risk**: brute force lockout (`429`) e credenciais inválidas.
- **Authorization Bypass Risk**: validação rigorosa de token (`401`).
- **Fraud / Balance Integrity Risk**: bloqueio de saldo insuficiente e valores inválidos.
- **Race Condition Risk (Double Spending)**: lock por conta de origem para impedir débito duplicado concorrente.
- **Operational Risk under Load**: testes de concorrência e monitoramento de latência.
- **Customer Experience / Compliance Risk**: checks básicos de WCAG e uso por teclado.

## 🛠️ Ferramentas

- Playwright + TypeScript
- Node.js (mock server)
- K6 (performance)
- OWASP ZAP (security baseline)

## ▶️ Como executar

1. Instalar dependências:

```bash
npm install
npx playwright install
```

2. Executar todos os testes (mock server sobe automaticamente):

```bash
npm test
```

3. Execuções segmentadas:

```bash
npm run test:ui
npm run test:api
npm run test:security
npm run test:accessibility
npm run test:perf
```

4. Relatório Playwright:

```bash
npm run report
```

## 🔐 OWASP ZAP (baseline)

Exemplo com Docker (alvo local):

```bash
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://host.docker.internal:3000 -r zap-report.html
```

## 🔄 Pronto para CI/CD

- Estrutura organizada por camadas e tipo de teste
- Configuração de reporter HTML no Playwright
- Scripts separados por domínio de qualidade (UI/API/Security/Perf/A11y)

## 🚀 Modo Enterprise

Este repositório já inclui um baseline enterprise com:

- Pipeline no GitHub Actions para execução automatizada da suíte
- Upload de artefatos de execução (`playwright-report` e `test-results`)
- Containerização do mock bank com Docker

Arquivos principais:

- `../.github/workflows/qa-ci.yml`
- `Dockerfile`
- `../docker-compose.yml`
- `../docs/enterprise-runbook.md`

### Executar mock com Docker

Na raiz do workspace:

```bash
docker compose up --build -d
```

Aplicação:

- http://localhost:3000
