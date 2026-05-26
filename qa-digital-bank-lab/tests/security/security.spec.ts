import { expect, test } from '../fixtures';
import { UserFactory } from '../../factories/user.factory';

test.describe('Security - OWASP aligned', () => {
  test('SQL Injection no login deve falhar', async ({ authService }) => {
    const payload = UserFactory.sqlInjectionAttempt();

    const response = await authService.login(payload.email, payload.password);
    expect(response.status()).toBe(401);
  });

  test('token inválido deve retornar 401', async ({ transferService }) => {
    const response = await transferService.account('token.invalido');
    expect(response.status()).toBe(401);
  });

  test('brute force deve retornar 429', async ({ authService }) => {
    for (let i = 0; i < 3; i += 1) {
      const res = await authService.login('alice@fakebank.com', `wrong-${i}`);
      expect(res.status()).toBe(401);
    }

    const blocked = await authService.login('alice@fakebank.com', 'wrong-last');
    expect(blocked.status()).toBe(429);
    await expect(blocked.json()).resolves.toHaveProperty('retryAfter');
  });

  test('token expirado ou inválido não permite transferência', async ({ transferService, aliceToken }) => {
    expect(aliceToken).toBeTruthy();

    const response = await transferService.transfer('expired.fake.token', 'ACC-2002', 10);
    expect(response.status()).toBe(401);
  });
});
