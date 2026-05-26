import { expect, test } from '../fixtures';
import { LoginPage } from '../../pages/login.page';
import { UserFactory } from '../../factories/user.factory';
import { loginAsAliceUi } from './ui-auth.helper';
import { maybePause } from './demo-mode';

test.describe('UI - Login', () => {
  test('deve autenticar com credenciais válidas', async ({ page }) => {
    await loginAsAliceUi(page);
    await expect(page.locator('#welcome')).toContainText('Alice');
    await maybePause(page);
  });

  test('deve falhar login com senha inválida', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const user = UserFactory.invalidPassword();

    await loginPage.goto();
    await maybePause(page);

    await loginPage.login(user.email, user.password);
    await maybePause(page);

    await loginPage.expectOnLogin();
    await loginPage.expectLoginError('Invalid credentials');
    await maybePause(page);
  });
});
