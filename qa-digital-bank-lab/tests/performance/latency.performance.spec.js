const { test } = require('../fixtures');
const { BankingApiDsl } = require('../api/banking-api.dsl');

test.describe('Performance - Latência da API', () => {
  test('Dado uma transferência / Quando medida a latência / Então responde em menos de 1000ms', 
    async ({ transferService, aliceToken }) => {
        const dsl = new BankingApiDsl({ transferService });
        dsl.dadoToken(aliceToken);

        await dsl.quandoTransferirMedindoLatencia({ amount: 10 });
        dsl.entaoStatus(201);
        dsl.entaoLatenciaMenorQue(1_000);
    });
});
