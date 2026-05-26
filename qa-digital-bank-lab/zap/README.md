# ZAP Baseline

Este diretório é reservado para artefatos de segurança com OWASP ZAP (relatórios HTML/JSON e configurações customizadas).

## Execução rápida

Com o mock server ativo em `http://localhost:3000`:

```bash
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://host.docker.internal:3000 -r zap-report.html
```

O relatório será gerado no container; para persistência local, monte volume Docker conforme sua máquina.
