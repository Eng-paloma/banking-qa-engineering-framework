const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const playwrightJsonPath = path.join(rootDir, 'playwright-report', 'results.json');
const qualityGatePath = path.join(rootDir, 'qa-report', 'quality-gate.json');
const historyPath = path.join(rootDir, 'qa-report', 'history', 'metrics-history.json');
const dashboardDir = path.join(rootDir, 'qa-report');
const dashboardPath = path.join(dashboardDir, 'index.html');

function readJsonSafe(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function flattenTests(report) {
  const tests = [];

  function chooseStatus(results = []) {
    if (!results.length) return 'unknown';
    const statuses = results.map((r) => r.status);
    if (statuses.includes('failed') || statuses.includes('timedOut') || statuses.includes('interrupted')) return 'failed';
    if (statuses.includes('skipped')) return 'skipped';
    if (statuses.includes('passed')) return 'passed';
    return statuses[0] || 'unknown';
  }

  function suiteWalk(suite, parents = []) {
    const title = suite.title || '';
    const nextParents = title ? [...parents, title] : parents;

    for (const childSuite of suite.suites || []) {
      suiteWalk(childSuite, nextParents);
    }

    for (const spec of suite.specs || []) {
      const fullSuite = nextParents.filter(Boolean).join(' › ');
      for (const test of spec.tests || []) {
        const status = chooseStatus(test.results || []);
        const duration = (test.results || []).reduce((sum, r) => sum + (r.duration || 0), 0);
        const errorMsg = (test.results || []).find((r) => r.error)?.error?.message || '';

        tests.push({
          suite: fullSuite,
          title: spec.title || '(sem título)',
          status,
          duration,
          project: test.projectName || '-',
          retries: test.results ? Math.max(0, test.results.length - 1) : 0,
          error: errorMsg
        });
      }
    }
  }

  for (const s of report.suites || []) suiteWalk(s);
  return tests;
}

function formatMs(ms = 0) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatDeltaPct(value) {
  const n = Number(value || 0);
  if (Number.isNaN(n)) return '0.0%';
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

const report = readJsonSafe(playwrightJsonPath, { suites: [] });
const qualityGate = readJsonSafe(qualityGatePath, null);
const history = readJsonSafe(historyPath, []);
const tests = flattenTests(report);

const totals = {
  total: tests.length,
  passed: tests.filter((t) => t.status === 'passed').length,
  failed: tests.filter((t) => t.status === 'failed').length,
  skipped: tests.filter((t) => t.status === 'skipped').length,
  unknown: tests.filter((t) => !['passed', 'failed', 'skipped'].includes(t.status)).length,
  duration: tests.reduce((acc, t) => acc + t.duration, 0)
};

const successRate = totals.total ? ((totals.passed / totals.total) * 100).toFixed(1) : '0.0';
const generatedAt = new Date().toLocaleString('pt-BR');

const suitesMap = new Map();
for (const t of tests) {
  if (!suitesMap.has(t.suite)) suitesMap.set(t.suite, { suite: t.suite, total: 0, passed: 0, failed: 0, duration: 0 });
  const row = suitesMap.get(t.suite);
  row.total += 1;
  row.duration += t.duration;
  if (t.status === 'passed') row.passed += 1;
  if (t.status === 'failed') row.failed += 1;
}

const suitesRows = [...suitesMap.values()].sort((a, b) => b.duration - a.duration);
const topSlow = [...tests].sort((a, b) => b.duration - a.duration).slice(0, 8);

const last = history.length ? history[history.length - 1] : null;
const previous = history.length > 1 ? history[history.length - 2] : null;
const durationDeltaPct = previous && previous.totalDurationMs && last
  ? ((last.totalDurationMs - previous.totalDurationMs) / previous.totalDurationMs) * 100
  : 0;
const passRateDeltaPct = previous && last ? (last.passRate - previous.passRate) : 0;
const trendRows = history.slice(-20);
const trendLabels = trendRows.map((h) => (h.buildId || '').toString().slice(-6));
const trendPassRates = trendRows.map((h) => h.passRate || 0);
const trendDurations = trendRows.map((h) => h.totalDurationMs || 0);
const gatePassed = qualityGate?.gate === 'passed';

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FakeBank QA - Relatório Executivo</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg: #0b1020;
      --panel: #111831;
      --panel-soft: #1a2549;
      --text: #e7ecff;
      --muted: #9aa6d1;
      --ok: #24c58a;
      --err: #ff5e7e;
      --warn: #f9c74f;
      --acc: #63a4ff;
      --border: #2a3767;
      --shadow: 0 10px 30px rgba(0, 0, 0, .35);
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, Segoe UI, Roboto, Arial, sans-serif;
      background: radial-gradient(circle at top right, #1d2a58 0%, var(--bg) 40%);
      color: var(--text);
    }

    .wrap { max-width: 1280px; margin: 0 auto; padding: 26px; }
    .header {
      display: flex; justify-content: space-between; gap: 20px; align-items: center;
      margin-bottom: 18px;
    }
    .title h1 { margin: 0; font-size: 28px; }
    .title p { margin: 6px 0 0; color: var(--muted); }

    .actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn {
      background: linear-gradient(135deg, #3a4fd6 0%, #5b7cff 100%);
      color: #fff; border: 0; padding: 10px 14px; border-radius: 10px;
      text-decoration: none; font-weight: 600; box-shadow: var(--shadow);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid var(--border);
      background: rgba(255,255,255,.04);
    }
    .badge.ok { color: var(--ok); border-color: rgba(36, 197, 138, .4); }
    .badge.err { color: var(--err); border-color: rgba(255, 94, 126, .4); }

    .grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 12px;
      margin: 14px 0 20px;
    }
    .card {
      background: linear-gradient(180deg, var(--panel) 0%, var(--panel-soft) 100%);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px;
      box-shadow: var(--shadow);
    }
    .card .label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .6px; }
    .card .value { font-size: 22px; margin-top: 4px; font-weight: 700; }

    .content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 14px;
    }

    .panel {
      background: rgba(17, 24, 49, .9);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      box-shadow: var(--shadow);
    }
    .panel h3 { margin: 0 0 12px; }

    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #26345f; font-size: 13px; }
    th { color: var(--muted); font-weight: 600; }

    .status { padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; display: inline-block; }
    .s-passed { background: rgba(36, 197, 138, .2); color: var(--ok); }
    .s-failed { background: rgba(255, 94, 126, .2); color: var(--err); }
    .s-skipped { background: rgba(249, 199, 79, .2); color: var(--warn); }
    .s-unknown { background: rgba(140, 140, 170, .2); color: #d9d9f8; }

    .toolbar {
      display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;
    }
    .filter { background: #1f2b53; border: 1px solid #30457f; color: #d6e1ff; padding: 8px 10px; border-radius: 10px; cursor: pointer; }
    .filter.active { border-color: #5b7cff; background: #24356d; }

    .search {
      width: 100%; border: 1px solid #30457f; border-radius: 10px; padding: 10px;
      background: #0f1732; color: #fff; margin-bottom: 10px;
    }

    .footer { color: var(--muted); margin-top: 14px; font-size: 12px; }

    @media (max-width: 1180px) {
      .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .content { grid-template-columns: 1fr; }
      .header { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="title">
        <h1>FakeBank QA · Relatório Executivo</h1>
        <p>Visão profissional e interativa das execuções · Gerado em ${escapeHtml(generatedAt)}</p>
      </div>
      <div class="actions">
        <span class="badge ${gatePassed ? 'ok' : 'err'}">Quality Gate: ${gatePassed ? 'PASS' : 'FAIL'}</span>
        <a class="btn" href="../playwright-report/index.html" target="_blank">Playwright HTML</a>
        <a class="btn" href="../monocart-report/index.html" target="_blank">Monocart</a>
        <a class="btn" href="../playwright-report/results.json" target="_blank">Raw JSON</a>
      </div>
    </div>

    <div class="grid">
      <div class="card"><div class="label">Total</div><div class="value">${totals.total}</div></div>
      <div class="card"><div class="label">Passed</div><div class="value" style="color:var(--ok)">${totals.passed}</div></div>
      <div class="card"><div class="label">Failed</div><div class="value" style="color:var(--err)">${totals.failed}</div></div>
      <div class="card"><div class="label">Success Rate</div><div class="value">${successRate}%</div></div>
      <div class="card"><div class="label">Tempo Total</div><div class="value">${formatMs(totals.duration)}</div></div>
      <div class="card"><div class="label">Δ Pass Rate vs build anterior</div><div class="value" style="color:${passRateDeltaPct >= 0 ? 'var(--ok)' : 'var(--err)'}">${formatDeltaPct(passRateDeltaPct)}</div></div>
      <div class="card"><div class="label">Δ Duração vs build anterior</div><div class="value" style="color:${durationDeltaPct <= 0 ? 'var(--ok)' : 'var(--warn)'}">${formatDeltaPct(durationDeltaPct)}</div></div>
    </div>

    <div class="content">
      <div class="panel">
        <h3>Status Geral</h3>
        <canvas id="statusChart" height="85"></canvas>
      </div>
      <div class="panel">
        <h3>Suites mais demoradas</h3>
        <canvas id="suiteChart" height="170"></canvas>
      </div>
    </div>

    <div class="panel" style="margin-bottom:14px;">
      <h3>Tendência histórica (últimos builds)</h3>
      <canvas id="trendChart" height="110"></canvas>
    </div>

    <div class="panel" style="margin-bottom:14px;">
      <h3>Top 8 testes mais lentos</h3>
      <table>
        <thead><tr><th>Teste</th><th>Suite</th><th>Status</th><th>Duração</th></tr></thead>
        <tbody>
          ${topSlow.map((t) => `<tr><td>${escapeHtml(t.title)}</td><td>${escapeHtml(t.suite)}</td><td><span class="status s-${escapeHtml(t.status)}">${escapeHtml(t.status)}</span></td><td>${formatMs(t.duration)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="panel">
      <h3>Todos os testes</h3>
      <input id="search" class="search" placeholder="Filtrar por teste ou suite..." />
      <div class="toolbar">
        <button class="filter active" data-status="all">Todos</button>
        <button class="filter" data-status="passed">Passed</button>
        <button class="filter" data-status="failed">Failed</button>
        <button class="filter" data-status="skipped">Skipped</button>
      </div>
      <table id="testsTable">
        <thead><tr><th>Teste</th><th>Suite</th><th>Projeto</th><th>Status</th><th>Retries</th><th>Duração</th></tr></thead>
        <tbody>
          ${tests.map((t) => `<tr data-status="${escapeHtml(t.status)}"><td title="${escapeHtml(t.error)}">${escapeHtml(t.title)}</td><td>${escapeHtml(t.suite)}</td><td>${escapeHtml(t.project)}</td><td><span class="status s-${escapeHtml(t.status)}">${escapeHtml(t.status)}</span></td><td>${t.retries}</td><td>${formatMs(t.duration)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">Dica: rode <strong>npm test</strong>, depois <strong>npm run quality:gate</strong> e <strong>npm run report:pro</strong>.</div>
  </div>

  <script>
    const statusCtx = document.getElementById('statusChart');
    new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['Passed', 'Failed', 'Skipped', 'Unknown'],
        datasets: [{
          data: [${totals.passed}, ${totals.failed}, ${totals.skipped}, ${totals.unknown}],
          backgroundColor: ['#24c58a', '#ff5e7e', '#f9c74f', '#8a8ab1']
        }]
      },
      options: { plugins: { legend: { labels: { color: '#e7ecff' } } } }
    });

    const suiteCtx = document.getElementById('suiteChart');
    new Chart(suiteCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(suitesRows.slice(0, 8).map((s) => s.suite || '(root)'))},
        datasets: [{
          label: 'Duração (ms)',
          data: ${JSON.stringify(suitesRows.slice(0, 8).map((s) => s.duration))},
          backgroundColor: '#63a4ff'
        }]
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: { ticks: { color: '#dbe4ff' }, grid: { color: 'rgba(255,255,255,.08)' } },
          y: { ticks: { color: '#dbe4ff' }, grid: { color: 'rgba(255,255,255,.08)' } }
        },
        plugins: { legend: { labels: { color: '#e7ecff' } } }
      }
    });

    const trendCtx = document.getElementById('trendChart');
    new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(trendLabels)},
        datasets: [
          {
            label: 'Pass Rate (%)',
            data: ${JSON.stringify(trendPassRates)},
            borderColor: '#24c58a',
            backgroundColor: 'rgba(36,197,138,.15)',
            yAxisID: 'yPass',
            tension: 0.3
          },
          {
            label: 'Duração total (ms)',
            data: ${JSON.stringify(trendDurations)},
            borderColor: '#63a4ff',
            backgroundColor: 'rgba(99,164,255,.15)',
            yAxisID: 'yDuration',
            tension: 0.3
          }
        ]
      },
      options: {
        scales: {
          yPass: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 100,
            ticks: { color: '#dbe4ff' },
            grid: { color: 'rgba(255,255,255,.08)' }
          },
          yDuration: {
            type: 'linear',
            position: 'right',
            ticks: { color: '#dbe4ff' },
            grid: { display: false }
          },
          x: {
            ticks: { color: '#dbe4ff' },
            grid: { color: 'rgba(255,255,255,.08)' }
          }
        },
        plugins: { legend: { labels: { color: '#e7ecff' } } }
      }
    });

    const search = document.getElementById('search');
    const rows = [...document.querySelectorAll('#testsTable tbody tr')];
    const filters = [...document.querySelectorAll('.filter')];
    let statusFilter = 'all';

    function applyFilter() {
      const q = search.value.toLowerCase().trim();
      rows.forEach((r) => {
        const statusOk = statusFilter === 'all' || r.dataset.status === statusFilter;
        const textOk = r.textContent.toLowerCase().includes(q);
        r.style.display = statusOk && textOk ? '' : 'none';
      });
    }

    search.addEventListener('input', applyFilter);
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        filters.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        statusFilter = btn.dataset.status;
        applyFilter();
      });
    });
  </script>
</body>
</html>`;

fs.mkdirSync(dashboardDir, { recursive: true });
fs.writeFileSync(dashboardPath, html, 'utf8');

// eslint-disable-next-line no-console
console.log(`Dashboard generated: ${dashboardPath}`);
