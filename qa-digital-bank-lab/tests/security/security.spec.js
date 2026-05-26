const { expect, test } = require('../fixtures');
const { UserFactory } = require('../../factories/user.factory');
const { BankingApiDsl } = require('../api/banking-api.dsl');

test.describe('Segurança - Alinhado ao OWASP', () => {
  test('Dado payload com SQL injection / Quando tentar autenticar / Então recebe 401', async ({ authService, transferService }) => {
    const dsl = new BankingApiDsl({ authService, transferService });
    const payload = UserFactory.sqlInjectionAttempt();

    await dsl.quandoLogarCom(payload.email, payload.password);
    dsl.entaoStatus(401);
  });

  test('Dado token inválido / Quando consultar conta / Então recebe 401', 
    async ({ authService, transferService }) => {
        const dsl = new BankingApiDsl({ authService, transferService });
        await dsl.quandoConsultarConta('token.invalido');
        dsl.entaoStatus(401);
    });

  test('Dado três tentativas falhas / Quando tentar novamente / Então recebe 429 com retryAfter', 
    async ({ authService, transferService }) => {
        const dsl = new BankingApiDsl({ authService, transferService });
        await dsl.quandoFalharLogin('alice@fakebank.com', 3);

        await dsl.quandoLogarCom('alice@fakebank.com', 'wrong-last');
        dsl.entaoStatus(429);
        await dsl.entaoPropriedade('retryAfter');
    });

  test('Dado token expirado / Quando tentar transferir / Então recebe 401', 
    async ({ authService, transferService, aliceToken }) => {
        const dsl = new BankingApiDsl({ authService, transferService });
        dsl.dadoToken(aliceToken);

        expect(aliceToken).toBeTruthy();

        await dsl.quandoTransferir({ token: 'expired.fake.token', amount: 10 });
        dsl.entaoStatus(401);
    });
});
