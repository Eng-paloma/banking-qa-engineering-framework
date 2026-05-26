import { Page } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { UserFactory } from '../../factories/user.factory';
import { maybePause } from './demo-mode';

export async function loginAsAliceUi(page: Page) {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const user = UserFactory.validAlice();

  await loginPage.goto();
  await maybePause(page);

  await loginPage.login(user.email, user.password);
  await dashboardPage.expectLoaded();
  await maybePause(page);

  return { loginPage, dashboardPage };
}
