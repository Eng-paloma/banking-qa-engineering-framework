const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const reportPath = path.join(rootDir, 'playwright-report', 'results.json');
const configPath = path.join(rootDir, 'quality-gate.config.json');
const historyPath = path.join(rootDir, 'qa-report', 'history', 'metrics-history.json');

function readJsonSafe(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
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

  function walkSuite(suite, parents = []) {
    const title = suite.title || '';
    const next = title ? [...parents, title] : parents;

    for (const child of suite.suites || []) walkSuite(child, next);

    for (const spec of suite.specs || []) {
      const suiteName = next.filter(Boolean).join(' › ');
      for (const test of spec.tests || []) {
        const status = chooseStatus(test.results || []);
        const duration = (test.results || []).reduce((acc, r) => acc + (r.duration || 0), 0);
        tests.push({
          suite: suiteName,
          title: spec.title || '(sem título)',
          status,
          duration,
          retries: test.results ? Math.max(0, test.results.length - 1) : 0
        });
      }
    }
  }

  for (const suite of report.suites || []) walkSuite(suite);
  return tests;
}

const report = readJsonSafe(reportPath);
if (!report) {
  console.error('Build History: arquivo não encontrado:', reportPath);
  process.exit(1);
}

const config = readJsonSafe(configPath, { history: { maxEntries: 120 } });
const maxEntries = config.history?.maxEntries || 120;

const tests = flattenTests(report);
const total = tests.length;
const passed = tests.filter((t) => t.status === 'passed').length;
const failed = tests.filter((t) => t.status === 'failed').length;
const skipped = tests.filter((t) => t.status === 'skipped').length;
const retried = tests.filter((t) => t.retries > 0).length;
const passRate = total ? Number(((passed / total) * 100).toFixed(2)) : 0;
const totalDurationMs = tests.reduce((acc, t) => acc + t.duration, 0);
const p95DurationMs = percentile(tests.map((t) => t.duration), 95);

const entry = {
  timestamp: new Date().toISOString(),
  buildId: process.env.GITHUB_RUN_ID || `local-${Date.now()}`,
  commit: (process.env.GITHUB_SHA || 'local').slice(0, 8),
  branch: process.env.GITHUB_REF_NAME || 'local',
  total,
  passed,
  failed,
  skipped,
  retried,
  passRate,
  totalDurationMs,
  p95DurationMs
};

const history = readJsonSafe(historyPath, []);
history.push(entry);

while (history.length > maxEntries) history.shift();

fs.mkdirSync(path.dirname(historyPath), { recursive: true });
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');

console.log(`Build History updated: ${historyPath}`);
console.log(`Entries: ${history.length}`);
console.log(`Last build: ${entry.buildId} | passRate=${entry.passRate}% | failed=${entry.failed}`);
