const { expect } = require('@playwright/test');

class TransferPage {
  constructor(page) {
    this.page = page;
  }

  async transfer(toAccount, amount) {
    await this.page.getByLabel('Conta destino').fill(toAccount);
    await this.page.getByLabel('Valor (R$)').fill(String(amount));
    await this.page.getByRole('button', { name: 'Transferir agora' }).click();
  }

  async expectSuccess() {
    await expect(this.page.locator('#transfer-message')).toContainText('Transferência realizada com sucesso');
  }

  async expectError(message) {
    await expect(this.page.locator('#transfer-message')).toContainText(message);
  }
}

module.exports = { TransferPage };
