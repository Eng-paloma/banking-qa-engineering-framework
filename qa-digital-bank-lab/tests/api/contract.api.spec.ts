import { expect, test } from '../fixtures';
import Ajv from 'ajv';

const ajv = new Ajv();
const accountSchema = {
  type: 'object',
  required: ['accountId', 'owner', 'balance'],
  properties: {
    accountId: { type: 'string' },
    owner: { type: 'string' },
    balance: { type: 'number', minimum: 0 }
  },
  additionalProperties: false
};

test.describe('API Contract - Conta e consistência', () => {
  test('schema da resposta de conta deve ser válido', async ({ transferService, aliceToken }) => {
    const response = await transferService.account(aliceToken);
    expect(response.status()).toBe(200);
    const body = await response.json();

    const valid = ajv.validate(accountSchema, body);
    expect(valid, JSON.stringify(ajv.errors)).toBeTruthy();
  });

  test('saldo deve permanecer consistente após transações', async ({ transferService, aliceToken }) => {
    const accountBefore = await (await transferService.account(aliceToken)).json();
    await transferService.transfer(aliceToken, 'ACC-2002', 100);
    await transferService.transfer(aliceToken, 'ACC-2002', 50);
    const accountAfter = await (await transferService.account(aliceToken)).json();

    expect(accountAfter.balance).toBe(accountBefore.balance - 150);
  });
});
