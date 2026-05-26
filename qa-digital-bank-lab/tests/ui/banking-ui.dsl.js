const { expect, test } = require('../fixtures');
const { LoginPage } = require('../../pages/login.page');
const { DashboardPage } = require('../../pages/dashboard.page');
const { TransferPage } = require('../../pages/transfer.page');
const { UserFactory } = require('../../factories/user.factory');
const { maybePause } = require('./demo-mode');

class BankingUiDsl {
  constructor(page) {
    this.page = page;
    this.loginPage = new LoginPage(page);
    this.dashboardPage = new DashboardPage(page);
    this.transferPage = new TransferPage(page);
  }

  async dadoLogin() {
    return test.step('Dado que o login está aberto', async () => {
      await this.loginPage.goto();
      await maybePause(this.page);
      return this;
    });
  }

  async dadoLogado() {
    return test.step('Dado que Alice está logada', async () => {
      const user = UserFactory.validAlice();
      await this.dadoLogin();
      await this.quandoCredenciais(user.email, user.password);
      await this.dashboardPage.expectLoaded();
      await maybePause(this.page);
      return this;
    });
  }

  async quandoCredenciais(email, password) {
    return test.step('Quando informo as credenciais', async () => {
      await this.loginPage.login(email, password);
      await maybePause(this.page);
      return this;
    });
  }

  async quandoTransferir({ amount, toAccount = 'ACC-2002' }) {
    return test.step('Quando transfiro valor informado', async () => {
      await this.transferPage.transfer(toAccount, amount);
      await maybePause(this.page);
      return this;
    });
  }

  async entaoBoasVindas(nome) {
    return test.step('Então a saudação deve aparecer', async () => {
      await expect(this.page.locator('#welcome')).toContainText(nome);
      await maybePause(this.page);
      return this;
    });
  }

  async entaoLogin() {
    return test.step('Então permaneço na tela de login', async () => {
      await this.loginPage.expectOnLogin();
      return this;
    });
  }

  async entaoErroLogin(message) {
    return test.step('Então vejo erro de login', async () => {
      await this.loginPage.expectLoginError(message);
      await maybePause(this.page);
      return this;
    });
  }

  async entaoTransferencia() {
    return test.step('Então a transferência é concluída', async () => {
      await this.transferPage.expectSuccess();
      await maybePause(this.page);
      return this;
    });
  }

  async entaoErroTransferencia(message) {
    return test.step('Então a transferência falha', async () => {
      await this.transferPage.expectError(message);
      await maybePause(this.page);
      return this;
    });
  }

  async entaoSaldo(valor) {
    return test.step('Então o saldo deve ser exibido', async () => {
      await this.dashboardPage.expectBalance(valor);
      await maybePause(this.page);
      return this;
    });
  }
}

module.exports = { BankingUiDsl };
