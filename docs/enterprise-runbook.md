# Enterprise Runbook

## CI/CD (GitHub Actions)

O pipeline está em:

- `.github/workflows/qa-ci.yml`

Fluxo:

1. Checkout do código
2. Setup Node 20 com cache de dependências
3. Instala dependências (`npm ci`)
4. Instala Playwright Chromium
5. Executa suíte principal (`npm test`)
6. Publica artefatos (`playwright-report` e `test-results`)

## Containerização

Arquivos:

- `qa-digital-bank-lab/Dockerfile`
- `docker-compose.yml`

### Subir mock bank com Docker

```bash
docker compose up --build -d
```

Aplicação disponível em:

- http://localhost:3000

### Derrubar ambiente

```bash
docker compose down
```

## Quality Gates recomendados

- Bloquear merge em caso de falha no workflow `QA CI`
- Exigir execução de testes em Pull Request
- Manter retenção de artefatos para análise de falhas

## Próximos upgrades enterprise

- Job separado para performance (`k6`) em pipeline agendado
- Job de security baseline (`OWASP ZAP`) noturno
- Publicação automática de relatório Playwright em páginas estáticas
