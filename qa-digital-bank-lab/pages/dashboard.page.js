const { expect } = require('@playwright/test');

class DashboardPage {
  constructor(page) {
    this.page = page;
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dashboard\.html/);
    await expect(this.page.locator('.topbar-title')).toBeVisible();
  }

  async expectBalance(value) {
    const formatted = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    await expect(this.page.locator('#balance')).toHaveText(formatted);
  }
}

module.exports = { DashboardPage };
