const { test } = require('../fixtures');
const { BankingUiDsl } = require('./banking-ui.dsl');

test.describe('UI - Transferências', () => {
  test('Dado usuário logado / Quando transferir R$100 / Então saldo é atualizado', 
    async ({ page }) => {
        const dsl = new BankingUiDsl(page);
        await dsl.dadoLogado();
        await dsl.quandoTransferir({ amount: 100 });
        await dsl.entaoTransferencia();
        await dsl.entaoSaldo(1100);
    });

  test('Dado saldo insuficiente / Quando tentar transferir R$9999 / Então exibe erro', 
    async ({ page }) => {
        const dsl = new BankingUiDsl(page);
        await dsl.dadoLogado();
        await dsl.quandoTransferir({ amount: 9999 });
        await dsl.entaoErroTransferencia('Insufficient funds');
        await dsl.entaoSaldo(1200);
    });
});
