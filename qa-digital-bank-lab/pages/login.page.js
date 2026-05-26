const { expect } = require('@playwright/test');

class LoginPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email, password) {
    await this.page.getByLabel('E-mail').fill(email);
    await this.page.getByLabel('Senha').fill(password);
    await this.page.getByRole('button', { name: 'Entrar na conta' }).click();
  }

  async expectOnLogin() {
    await expect(this.page).toHaveURL(/\/($|index\.html)/);
    await expect(this.page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
  }

  async expectLoginError(message) {
    await expect(this.page.locator('#message')).toContainText(message);
  }
}

module.exports = { LoginPage };
