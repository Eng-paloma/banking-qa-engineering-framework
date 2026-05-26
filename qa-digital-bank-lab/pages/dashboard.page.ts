import { expect, Page } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dashboard\.html/);
    await expect(this.page.locator('.topbar-title')).toBeVisible();
  }

  async balanceText() {
    return this.page.locator('#balance').innerText();
  }

  async expectBalance(value: number) {
    const formatted = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    await expect(this.page.locator('#balance')).toHaveText(formatted);
  }
}
