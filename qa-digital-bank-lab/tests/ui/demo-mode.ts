import { Page } from '@playwright/test';

export async function maybePause(page: Page, ms = 2000): Promise<void> {
  if (process.env.DEMO_MODE === 'true') {
    await page.waitForTimeout(ms);
  }
}
