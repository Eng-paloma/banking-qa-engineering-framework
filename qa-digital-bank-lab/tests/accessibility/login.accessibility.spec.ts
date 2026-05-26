import { expect, test } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';
import { maybePause } from '../ui/demo-mode';

test.describe('Accessibility - Login WCAG básico', () => {
  test('tela de login deve ter labels e nome acessível', async ({ page }) => {
    await page.goto('/');
    await maybePause(page);
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar na conta' })).toBeVisible();
  });

  test('navegação por teclado no formulário de login', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    await expect(page.getByLabel('E-mail')).toBeFocused();
    await maybePause(page);

    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Senha')).toBeFocused();
    await maybePause(page);

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Entrar na conta' })).toBeFocused();
    await maybePause(page);
  });

  test('não deve ter violações críticas de a11y na tela de login', async ({ page }) => {
    await page.goto('/');

    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(scan.violations).toEqual([]);
  });
});
