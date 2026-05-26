const { test } = require('../fixtures');
const Ajv = require('ajv');
const { BankingApiDsl } = require('./banking-api.dsl');

const ajv = new Ajv();
const accountSchema = {
  type: 'object',
  required: ['accountId', 'owner', 'balance'],
  properties: {
    accountId: { type: 'string' },
    owner: { type: 'string' },
    balance: { type: 'number', minimum: 0 }
  },
  additionalProperties: false
};

test.describe('API - Contrato e consistência', () => {
  test('Dado conta consultada / Quando verificar resposta / Então schema é válido', 
    async ({ transferService, aliceToken }) => {
        const dsl = new BankingApiDsl({ transferService });
        dsl.dadoToken(aliceToken);

        await dsl.quandoConsultarConta();
        dsl.entaoStatus(200);
        await dsl.entaoUltimaRespostaSchema((body) => ajv.validate(accountSchema, body));
    });

  test('Dado saldo inicial / Quando realizar duas transferências / Então saldo reflete total debitado',
    async ({ transferService, aliceToken }) => {
        const dsl = new BankingApiDsl({ transferService });
        dsl.dadoToken(aliceToken);

        await dsl.dadoSaldoInicial();
        await dsl.quandoTransferir({ amount: 100 });
        dsl.entaoStatus(201);

        await dsl.quandoTransferir({ amount: 50 });
        dsl.entaoStatus(201);

        await dsl.entaoSaldoVariou(-150);
    });
    });
