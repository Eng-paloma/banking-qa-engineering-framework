# OWASP ZAP — FakeBank Security Scan

Integração com o **ZAP Automation Framework** para scan DAST da API e dashboard.

## Estrutura

```
zap/
├── automation.yaml   # Configuração completa: spider, scan ativo, relatórios
├── run-zap.ps1       # Script PowerShell que executa o container e salva output
└── reports/          # Relatórios gerados (HTML + JSON) — ignorado pelo git
```

## Pré-requisitos

- Docker Desktop rodando
- Mock server ativo: `npm run mock:start`

## Execução

```powershell
# A partir da raiz do projeto:
npm run test:zap

# Ou diretamente:
.\zap\run-zap.ps1
```

O script verifica se o mock está respondendo antes de iniciar o container.
Os relatórios são salvos em `zap/reports/zap-report.html` e `zap-report.json`.

## O que o scan cobre

| Job | Descrição |
|-----|-----------|
| Spider | Mapeia todas as rotas da API automaticamente |
| Ajax Spider | Rastreia o dashboard interativo |
| Scan Passivo | Analisa headers, cookies, informações expostas |
| Scan Ativo | Testa injeções SQL/XSS, IDOR, misconfigurações |
| exitStatus | Quebra o pipeline se houver alerta de risco **Alto** ou **Crítico** |

## Códigos de saída

| Código | Significado |
|--------|-------------|
| 0 | Sem alertas críticos |
| 2 | Avisos encontrados (revisar relatório) |
| outros | Alertas de alto risco — pipeline deve falhar |
