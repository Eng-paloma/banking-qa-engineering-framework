const { test } = require('../fixtures');
const { BankingApiDsl } = require('./banking-api.dsl');

test.describe('API - Regras bancárias', () => {
  test('Dado token válido / Quando transferir R$100 / Então status 201 e saldo atualizado', async ({ transferService, aliceToken }) => {
    const dsl = new BankingApiDsl({ transferService });
    dsl.dadoToken(aliceToken);

    await dsl.quandoTransferir({ amount: 100 });
    dsl.entaoStatus(201);
    await dsl.entaoSaldo(1100);
  });

  [
    {
      name: 'Dado saldo insuficiente / Quando transferir R$5000 / Então status 409',
      amount: 5000,
      status: 409,
      error: 'Insufficient funds'
    },
    {
      name: 'Dado valor negativo / Quando transferir R$-10 / Então status 422',
      amount: -10,
      status: 422,
      error: 'Invalid transfer amount'
    }
  ].forEach(({ name, amount, status, error }) => {
    test(name, async ({ transferService, aliceToken }) => {
      const dsl = new BankingApiDsl({ transferService });
      dsl.dadoToken(aliceToken);

      await dsl.quandoTransferir({ amount });
      dsl.entaoStatus(status);
      await dsl.entaoErro(error);
    });
  });

  test('Dado duas requisições simultâneas / Quando ambas transferirem R$800 / Então apenas uma é aprovada', 
    async ({ transferService, aliceToken }) => {
        const dsl = new BankingApiDsl({ transferService });
        dsl.dadoToken(aliceToken);

        const [r1, r2] = await dsl.quandoTransferenciasConcorrentes({ amount: 800 });

        await dsl.entaoApenasUmaTransferencia([r1, r2]);

        await dsl.entaoSaldoEntre(400, 1200);
    });
});
