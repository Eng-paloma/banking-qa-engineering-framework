const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['monocart-reporter', {
      name: 'FakeBank QA — Relatório de Testes',
      outputFile: 'monocart-report/index.html',
      open: 'never',
      columns: (defaultColumns) => {
        const durationColumn = defaultColumns.find((c) => c.id === 'duration');
        if (durationColumn) durationColumn.minWidth = 80;
        return defaultColumns;
      },
      trends: ['monocart-report/trend.json'],
      summary: true
    }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: {
      'Content-Type': 'application/json'
    }
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm run mock:start',
    cwd: __dirname,
    url: 'http://localhost:3000/health',
    timeout: 60_000,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe'
  }
});
