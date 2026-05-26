# run-zap.ps1 — Executa OWASP ZAP Automation Framework contra o mock local
#
# Pré-requisitos:
#   - Docker Desktop rodando
#   - Mock server ativo: npm run mock:start
#
# Uso:
#   .\zap\run-zap.ps1
#   .\zap\run-zap.ps1 -BaseUrl "http://host.docker.internal:3000"

param(
  [string]$BaseUrl = "http://host.docker.internal:3000",
  [string]$ZapImage = "ghcr.io/zaproxy/zaproxy:stable"
)

$ErrorActionPreference = "Stop"
$ReportsDir = Join-Path $PSScriptRoot "reports"

# Garante pasta de relatórios
if (-not (Test-Path $ReportsDir)) {
  New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   OWASP ZAP — FakeBank Security Scan    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "► Alvo  : $BaseUrl" -ForegroundColor Yellow
Write-Host "► Imagem: $ZapImage" -ForegroundColor Yellow
Write-Host "► Output: $ReportsDir" -ForegroundColor Yellow
Write-Host ""

# Verifica se o mock está respondendo
Write-Host "► Verificando mock server..." -ForegroundColor Gray
try {
  $health = Invoke-WebRequest -Uri "$($BaseUrl -replace 'host.docker.internal','localhost')/health" -UseBasicParsing -TimeoutSec 5
  if ($health.StatusCode -ne 200) { throw "Mock retornou $($health.StatusCode)" }
  Write-Host "  ✓ Mock server OK" -ForegroundColor Green
} catch {
  Write-Host "  ✗ Mock server não está rodando. Execute: npm run mock:start" -ForegroundColor Red
  exit 1
}

# Monta o volume com o diretório zap/ e executa o automation framework
$ZapDir = $PSScriptRoot -replace '\\', '/'
# Converte caminho Windows para formato Docker (ex: C:/Users/... → /c/Users/...)
$ZapDirDocker = $ZapDir -replace '^([A-Z]):', { "/$(($_.Groups[1].Value).ToLower())" }

Write-Host ""
Write-Host "► Iniciando container ZAP..." -ForegroundColor Gray
Write-Host ""

docker run --rm `
  --network host `
  -v "${ZapDir}:/zap/wrk/:rw" `
  -t $ZapImage `
  zap.sh -cmd -autorun /zap/wrk/automation.yaml

$ExitCode = $LASTEXITCODE

Write-Host ""
if ($ExitCode -eq 0) {
  Write-Host "✓ Scan concluído sem alertas críticos." -ForegroundColor Green
} elseif ($ExitCode -eq 2) {
  Write-Host "⚠ Scan concluído com AVISOS. Verifique o relatório." -ForegroundColor Yellow
} else {
  Write-Host "✗ Scan encontrou alertas de ALTO RISCO (exit $ExitCode)." -ForegroundColor Red
}

Write-Host ""
Write-Host "► Relatórios salvos em: $ReportsDir" -ForegroundColor Cyan
Write-Host "  • zap-report.html" -ForegroundColor Gray
Write-Host "  • zap-report.json" -ForegroundColor Gray
Write-Host ""

exit $ExitCode
