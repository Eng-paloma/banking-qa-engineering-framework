const { expect } = require('@playwright/test');

async function resetState(request) {
  const response = await request.post('/api/reset');
  expect(response.status()).toBe(200);
}

module.exports = { resetState };
