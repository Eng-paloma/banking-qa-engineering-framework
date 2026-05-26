import { expect, test as base } from '@playwright/test';
import { AuthService } from '../services/auth.service';
import { TransferService } from '../services/transfer.service';
import { UserFactory } from '../factories/user.factory';
import { resetState } from './test-helpers';

type QaFixtures = {
  resetBankState: void;
  authService: AuthService;
  transferService: TransferService;
  aliceToken: string;
};

export const test = base.extend<QaFixtures>({
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
    await use(body.token as string);
  }
});

export { expect };
