import { expect, test } from '../fixtures';
import { TransferBuilder } from '../../builders/transfer.builder';

test.describe('API - Regras bancárias', () => {
  test('transferência com sucesso', async ({ transferService, aliceToken }) => {
    const payload = new TransferBuilder().withDestination('ACC-2002').withAmount(100).build();

    const response = await transferService.transfer(aliceToken, payload.toAccount, payload.amount);
    expect(response.status()).toBe(201);

    const accountResponse = await transferService.account(aliceToken);
    const account = await accountResponse.json();
    expect(account.balance).toBe(1100);
  });

  test('transferência com saldo insuficiente', async ({ transferService, aliceToken }) => {
    const response = await transferService.transfer(aliceToken, 'ACC-2002', 5000);
    expect(response.status()).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: 'Insufficient funds' });
  });

  test('transferência com valor inválido', async ({ transferService, aliceToken }) => {
    const response = await transferService.transfer(aliceToken, 'ACC-2002', -10);
    expect(response.status()).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ error: 'Invalid transfer amount' });
  });

  test('prevenção de double spending com concorrência', async ({ transferService, aliceToken }) => {
    const [r1, r2] = await Promise.all([
      transferService.transfer(aliceToken, 'ACC-2002', 800),
      transferService.transfer(aliceToken, 'ACC-2002', 800)
    ]);

    const statuses = [r1.status(), r2.status()];
    const successCount = statuses.filter((status) => status === 201).length;
    const blockedCount = statuses.filter((status) => status === 409).length;

    expect(successCount).toBe(1);
    expect(blockedCount).toBe(1);

    const accountResponse = await transferService.account(aliceToken);
    const account = await accountResponse.json();
    expect(account.balance).toBeGreaterThanOrEqual(400);
    expect(account.balance).toBeLessThanOrEqual(1200);
  });
});
