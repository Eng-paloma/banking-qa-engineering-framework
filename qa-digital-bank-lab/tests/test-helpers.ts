import { APIRequestContext, expect } from '@playwright/test';

export async function resetState(request: APIRequestContext) {
  const response = await request.post('/api/reset');
  expect(response.status()).toBe(200);
}
