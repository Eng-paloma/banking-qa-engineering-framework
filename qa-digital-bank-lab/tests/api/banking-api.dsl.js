const { expect, test } = require('../fixtures');

class BankingApiDsl {
  constructor({ transferService, authService }) {
    this.transferService = transferService;
    this.authService = authService;

    this.token = null;
    this.lastResponse = null;
    this.lastDurationMs = null;
    this.initialBalance = null;
  }

  dadoToken(token) {
    this.token = token;
    return this;
  }

  async dadoSaldoInicial() {
    this.initialBalance = await this.obterSaldoAtual();
    return this;
  }

  async quandoConsultarConta(token = this.token) {
    return test.step('Quando consulto a conta', async () => {
      this.lastResponse = await this.transferService.account(token);
      return this;
    });
  }

  async quandoTransferir({ amount, toAccount = 'ACC-2002', token = this.token }) {
    return test.step('Quando realizo a transferência', async () => {
      this.lastResponse = await this.transferService.transfer(token, toAccount, amount);
      return this;
    });
  }

  async quandoTransferirMedindoLatencia({ amount, toAccount = 'ACC-2002', token = this.token }) {
    return test.step('Quando realizo a transferência medindo latência', async () => {
      const start = Date.now();
      this.lastResponse = await this.transferService.transfer(token, toAccount, amount);
      this.lastDurationMs = Date.now() - start;
      return this;
    });
  }

  async quandoTransferenciasConcorrentes({ amount, toAccount = 'ACC-2002', token = this.token, count = 2 }) {
    return test.step('Quando realizo transferências concorrentes', async () => {
      const calls = Array.from({ length: count }, () => this.transferService.transfer(token, toAccount, amount));
      return Promise.all(calls);
    });
  }

  async quandoLogarCom(email, password) {
    return test.step('Quando faço login', async () => {
      this.lastResponse = await this.authService.login(email, password);
      return this;
    });
  }

  async quandoFalharLogin(email, attempts) {
    return test.step('Quando falho o login repetidas vezes', async () => {
      for (let i = 0; i < attempts; i += 1) {
        const response = await this.authService.login(email, `wrong-${i}`);
        expect(response.status()).toBe(401);
      }
      return this;
    });
  }

  entaoStatus(status) {
    return test.step('Então o status deve ser esperado', async () => {
      expect(this.lastResponse.status()).toBe(status);
      return this;
    });
  }

  async entaoErro(message) {
    return test.step('Então a resposta deve trazer erro', async () => {
      await expect(this.lastResponse.json()).resolves.toMatchObject({ error: message });
      return this;
    });
  }

  async entaoPropriedade(property) {
    return test.step('Então a resposta deve conter a propriedade', async () => {
      await expect(this.lastResponse.json()).resolves.toHaveProperty(property);
      return this;
    });
  }

  entaoLatenciaMenorQue(ms) {
    return test.step('Então a latência deve estar dentro do limite', async () => {
      expect(this.lastDurationMs).toBeLessThan(ms);
      return this;
    });
  }

  async obterContaAtual() {
    const response = await this.transferService.account(this.token);
    expect(response.status()).toBe(200);
    return response.json();
  }

  async obterSaldoAtual() {
    const account = await this.obterContaAtual();
    return account.balance;
  }

  async entaoSaldo(value) {
    return test.step('Então o saldo deve ser o esperado', async () => {
      expect(await this.obterSaldoAtual()).toBe(value);
      return this;
    });
  }

  async entaoSaldoVariou(delta) {
    return test.step('Então o saldo deve variar conforme esperado', async () => {
      const currentBalance = await this.obterSaldoAtual();
      expect(currentBalance).toBe(this.initialBalance + delta);
      return this;
    });
  }

  async entaoSaldoEntre(minimo, maximo) {
    return test.step('Então o saldo deve ficar em faixa válida', async () => {
      const currentBalance = await this.obterSaldoAtual();
      expect(currentBalance).toBeGreaterThanOrEqual(minimo);
      expect(currentBalance).toBeLessThanOrEqual(maximo);
      return this;
    });
  }

  async entaoApenasUmaTransferencia(responses) {
    return test.step('Então apenas uma transferência deve passar', async () => {
      const statuses = responses.map((response) => response.status());
      const successCount = statuses.filter((status) => status === 201).length;
      const blockedCount = statuses.filter((status) => status === 409).length;

      expect(successCount).toBe(1);
      expect(blockedCount).toBe(1);
      return this;
    });
  }

  async entaoUltimaRespostaSchema(validateSchema) {
    return test.step('Então o schema da resposta deve ser válido', async () => {
      const body = await this.lastResponse.json();
      const valid = validateSchema(body);
      expect(valid).toBeTruthy();
      return this;
    });
  }
}

module.exports = { BankingApiDsl };
