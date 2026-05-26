const { test } = require('../fixtures');
const { UserFactory } = require('../../factories/user.factory');
const { BankingUiDsl } = require('./banking-ui.dsl');

test.describe('UI - Login', () => {
  test('Dado usuário válido / Quando fizer login / Então vê boas-vindas', 
    async ({ page }) => {
        const dsl = new BankingUiDsl(page);
        await dsl.dadoLogado();
        await dsl.entaoBoasVindas('Alice');
    });

  test('Dado senha inválida / Quando fizer login / Então vê mensagem de erro', 
    async ({ page }) => {
        const dsl = new BankingUiDsl(page);
        const user = UserFactory.invalidPassword();

        await dsl.dadoLogin();
        await dsl.quandoCredenciais(user.email, user.password);
        await dsl.entaoLogin();
        await dsl.entaoErroLogin('Invalid credentials');
    });
});
