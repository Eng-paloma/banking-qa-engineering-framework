import { expect, test } from '../fixtures';

test.describe('Performance smoke - API latency', () => {
  test('transferência deve responder dentro de limite aceitável', async ({ transferService, aliceToken }) => {
    const start = Date.now();
    const response = await transferService.transfer(aliceToken, 'ACC-2002', 10);
    const duration = Date.now() - start;

    expect(response.status()).toBe(201);
    expect(duration).toBeLessThan(1_000);
  });
});
