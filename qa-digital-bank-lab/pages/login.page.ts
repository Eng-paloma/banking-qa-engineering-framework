import { expect, Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('E-mail').fill(email);
    await this.page.getByLabel('Senha').fill(password);
    await this.page.getByRole('button', { name: 'Entrar na conta' }).click();
  }

  async expectOnLogin() {
    await expect(this.page).toHaveURL(/\/($|index\.html)/);
    await expect(this.page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
  }

  async expectLoginError(message: string) {
    await expect(this.page.locator('#message')).toContainText(message);
  }
}
