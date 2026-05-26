const { expect, test } = require('../fixtures');
const AxeBuilder = require('@axe-core/playwright');
const { maybePause } = require('../ui/demo-mode');

class AccessibilityLoginDsl {
  constructor(page) {
    this.page = page;
    this.scan = null;
  }

  async dadoTela() {
    return test.step('Dado que a tela de login está aberta', async () => {
      await this.page.goto('/');
      await maybePause(this.page);
      return this;
    });
  }

  async entaoCamposVisiveis() {
    return test.step('Então os campos essenciais devem estar visíveis', async () => {
      await expect(this.page.getByLabel('E-mail')).toBeVisible();
      await expect(this.page.getByLabel('Senha')).toBeVisible();
      await expect(this.page.getByRole('button', { name: 'Entrar na conta' })).toBeVisible();
      return this;
    });
  }

  async quandoTab(vezes) {
    return test.step('Quando navego com Tab', async () => {
      for (let i = 0; i < vezes; i += 1) {
        await this.page.keyboard.press('Tab');
      }

      await maybePause(this.page);
      return this;
    });
  }

  async entaoFocoEmail() {
    return test.step('Então o foco deve estar no e-mail', async () => {
      await expect(this.page.getByLabel('E-mail')).toBeFocused();
      return this;
    });
  }

  async entaoFocoSenha() {
    return test.step('Então o foco deve estar na senha', async () => {
      await expect(this.page.getByLabel('Senha')).toBeFocused();
      return this;
    });
  }

  async entaoFocoBotaoEntrar() {
    return test.step('Então o foco deve estar no botão entrar', async () => {
      await expect(this.page.getByRole('button', { name: 'Entrar na conta' })).toBeFocused();
      return this;
    });
  }

  async quandoScanA11y(tags = ['wcag2a', 'wcag2aa']) {
    return test.step('Quando executo o scan de acessibilidade', async () => {
      this.scan = await new AxeBuilder({ page: this.page }).withTags(tags).analyze();
      return this;
    });
  }

  async entaoSemViolacoesCriticas() {
    return test.step('Então não deve haver violações críticas', async () => {
      expect(this.scan.violations).toEqual([]);
      return this;
    });
  }
}

module.exports = { AccessibilityLoginDsl };
