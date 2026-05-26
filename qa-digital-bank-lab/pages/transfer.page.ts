import { expect, Page } from '@playwright/test';

export class TransferPage {
  constructor(private readonly page: Page) {}

  async transfer(toAccount: string, amount: number) {
    await this.page.getByLabel('Conta destino').fill(toAccount);
    await this.page.getByLabel('Valor (R$)').fill(String(amount));
    await this.page.getByRole('button', { name: 'Transferir agora' }).click();
  }

  async expectSuccess() {
    await expect(this.page.locator('#transfer-message')).toContainText('Transferência realizada com sucesso');
  }

  async expectError(message: string) {
    await expect(this.page.locator('#transfer-message')).toContainText(message);
  }
}
