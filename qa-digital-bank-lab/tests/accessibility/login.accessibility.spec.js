const { test } = require('../fixtures');
const { AccessibilityLoginDsl } = require('./accessibility-login.dsl');

test.describe('Acessibilidade - Login WCAG básico', () => {
  test('Dado tela de login / Quando verificar campos / Então labels e nomes acessíveis visíveis', 
    async ({ page }) => {
        const dsl = new AccessibilityLoginDsl(page);
        await dsl.dadoTela();
        await dsl.entaoCamposVisiveis();
    });

  test('Dado tela de login / Quando navegar por Tab / Então foco percorre email, senha e botão', 
    async ({ page }) => {
        const dsl = new AccessibilityLoginDsl(page);
        await dsl.dadoTela();
        await dsl.quandoTab(1);
        await dsl.entaoFocoEmail();

        await dsl.quandoTab(1);
        await dsl.entaoFocoSenha();

        await dsl.quandoTab(1);
        await dsl.entaoFocoBotaoEntrar();
    });

  test('Dado tela de login / Quando escanear a11y / Então sem violações críticas', 
    async ({ page }) => {
        const dsl = new AccessibilityLoginDsl(page);
        await dsl.dadoTela();
        await dsl.quandoScanA11y();
        await dsl.entaoSemViolacoesCriticas();
    });
});
