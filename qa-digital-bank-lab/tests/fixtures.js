const { expect, test: base } = require('@playwright/test');
const { AuthService } = require('../services/auth.service');
const { TransferService } = require('../services/transfer.service');
const { UserFactory } = require('../factories/user.factory');
const { resetState } = require('./test-helpers');

const test = base.extend({
  resetBankState: [
    async ({ request }, use) => {
      await resetState(request);
      await use();
    },
    { auto: true }
  ],
  authService: async ({ request }, use) => {
    await use(new AuthService(request));
  },
  transferService: async ({ request }, use) => {
    await use(new TransferService(request));
  },
  aliceToken: async ({ authService }, use) => {
    const user = UserFactory.validAlice();
    const response = await authService.login(user.email, user.password);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await use(body.token);
  }
});

module.exports = { test, expect };
