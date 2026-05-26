import { test } from '../fixtures';
import { DashboardPage } from '../../pages/dashboard.page';
import { TransferPage } from '../../pages/transfer.page';
import { loginAsAliceUi } from './ui-auth.helper';
import { maybePause } from './demo-mode';

test.describe('UI - Transferências', () => {
  test('deve transferir com sucesso', async ({ page }) => {
    const { dashboardPage } = await loginAsAliceUi(page);
    const transferPage = new TransferPage(page);

    await transferPage.transfer('ACC-2002', 100);
    await maybePause(page);

    await transferPage.expectSuccess();
    await dashboardPage.expectBalance(1100);
    await maybePause(page);
  });

  test('deve bloquear transferência sem saldo', async ({ page }) => {
    const { dashboardPage } = await loginAsAliceUi(page);
    const transferPage = new TransferPage(page);

    await transferPage.transfer('ACC-2002', 9999);
    await maybePause(page);

    await transferPage.expectError('Insufficient funds');
    await dashboardPage.expectBalance(1200);
    await maybePause(page);
  });
});
