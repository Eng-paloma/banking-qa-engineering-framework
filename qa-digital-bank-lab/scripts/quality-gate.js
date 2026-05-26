const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const reportPath = path.join(rootDir, 'playwright-report', 'results.json');
const configPath = path.join(rootDir, 'quality-gate.config.json');
const historyPath = path.join(rootDir, 'qa-report', 'history', 'metrics-history.json');
const outputPath = path.join(rootDir, 'qa-report', 'quality-gate.json');

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
          retries: test.results ? Math.max(0, test.results.length - 1) : 0,
          project: test.projectName || '-'
        });
      }
    }
  }

  for (const suite of report.suites || []) walkSuite(suite);
  return tests;
}

const report = readJsonSafe(reportPath);
if (!report) {
  console.error('Quality Gate: arquivo não encontrado:', reportPath);
  process.exit(1);
}

const config = readJsonSafe(configPath, {
  thresholds: {
    maxFailedTests: 0,
    minPassRate: 100,
    maxP95DurationMs: 5000,
    maxRetriedTests: 2
  },
  regression: {
    maxDurationIncreasePct: 25,
    maxPassRateDropPct: 2
  }
});

const tests = flattenTests(report);
const total = tests.length;
const passed = tests.filter((t) => t.status === 'passed').length;
const failed = tests.filter((t) => t.status === 'failed').length;
const skipped = tests.filter((t) => t.status === 'skipped').length;
const retried = tests.filter((t) => t.retries > 0).length;
const totalDurationMs = tests.reduce((acc, t) => acc + t.duration, 0);
const passRate = total ? Number(((passed / total) * 100).toFixed(2)) : 0;
const p95DurationMs = percentile(tests.map((t) => t.duration), 95);

const history = readJsonSafe(historyPath, []);
const baseline = history.length ? history[history.length - 1] : null;

const durationIncreasePct = baseline && baseline.totalDurationMs
  ? Number((((totalDurationMs - baseline.totalDurationMs) / baseline.totalDurationMs) * 100).toFixed(2))
  : 0;
const passRateDropPct = baseline
  ? Number((baseline.passRate - passRate).toFixed(2))
  : 0;

const checks = [
  {
    rule: 'maxFailedTests',
    ok: failed <= config.thresholds.maxFailedTests,
    actual: failed,
    expected: `<= ${config.thresholds.maxFailedTests}`
  },
  {
    rule: 'minPassRate',
    ok: passRate >= config.thresholds.minPassRate,
    actual: passRate,
    expected: `>= ${config.thresholds.minPassRate}`
  },
  {
    rule: 'maxP95DurationMs',
    ok: p95DurationMs <= config.thresholds.maxP95DurationMs,
    actual: p95DurationMs,
    expected: `<= ${config.thresholds.maxP95DurationMs}`
  },
  {
    rule: 'maxRetriedTests',
    ok: retried <= config.thresholds.maxRetriedTests,
    actual: retried,
    expected: `<= ${config.thresholds.maxRetriedTests}`
  }
];

if (baseline) {
  checks.push(
    {
      rule: 'maxDurationIncreasePct',
      ok: durationIncreasePct <= config.regression.maxDurationIncreasePct,
      actual: durationIncreasePct,
      expected: `<= ${config.regression.maxDurationIncreasePct}`
    },
    {
      rule: 'maxPassRateDropPct',
      ok: passRateDropPct <= config.regression.maxPassRateDropPct,
      actual: passRateDropPct,
      expected: `<= ${config.regression.maxPassRateDropPct}`
    }
  );
}

const ok = checks.every((c) => c.ok);

const summary = {
  generatedAt: new Date().toISOString(),
  gate: ok ? 'passed' : 'failed',
  baselineExists: !!baseline,
  metrics: {
    total,
    passed,
    failed,
    skipped,
    retried,
    passRate,
    p95DurationMs,
    totalDurationMs,
    durationIncreasePct,
    passRateDropPct
  },
  checks
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf8');

console.log(`Quality Gate: ${ok ? 'PASS' : 'FAIL'}`);
for (const c of checks) {
  console.log(`${c.ok ? '✅' : '❌'} ${c.rule} | actual=${c.actual} expected ${c.expected}`);
}
console.log(`Saved: ${outputPath}`);

if (!ok) process.exit(1);
