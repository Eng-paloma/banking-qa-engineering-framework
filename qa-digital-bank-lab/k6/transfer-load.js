import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ---------------------------------------------------------------------------
// Métricas customizadas
// ---------------------------------------------------------------------------
const loginDuration   = new Trend('login_duration_ms', true);
const transferSuccess = new Rate('transfer_success_rate');
const accountQueries  = new Counter('account_queries_total');

// ---------------------------------------------------------------------------
// Configuração: ramp-up → pico → ramp-down
// ---------------------------------------------------------------------------
export const options = {
  stages: [
    { duration: '15s', target: 5  }, // aquecimento
    { duration: '30s', target: 20 }, // carga nominal
    { duration: '15s', target: 40 }, // pico
    { duration: '20s', target: 0  }  // ramp-down
  ],
  thresholds: {
    http_req_failed:      ['rate<0.05'],         // <5% de erros HTTP
    http_req_duration:    ['p(95)<800'],          // 95% das req em <800ms
    login_duration_ms:    ['p(99)<1000'],         // login p99 <1s
    transfer_success_rate:['rate>0.85']           // >85% de transferências ok
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const HEADERS  = { 'Content-Type': 'application/json' };

// ---------------------------------------------------------------------------
// setup(): executa UMA VEZ antes de todos os VUs — obtém token compartilhado
// ---------------------------------------------------------------------------
export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: 'alice@fakebank.com', password: 'Bank@123' }),
    { headers: HEADERS }
  );

  check(res, { 'setup: login OK': (r) => r.status === 200 });
  return { token: res.json('token') };
}

// ---------------------------------------------------------------------------
// Cenário principal — recebe data do setup()
// ---------------------------------------------------------------------------
export default function (data) {
  const authHeaders = {
    ...HEADERS,
    Authorization: `Bearer ${data.token}`
  };

  // ── Cenário 1: Consulta de saldo ─────────────────────────────────────────
  group('consultar conta', () => {
    const res = http.get(`${BASE_URL}/api/account`, { headers: authHeaders });

    check(res, {
      'account: status 200':    (r) => r.status === 200,
      'account: tem balance':   (r) => r.json('balance') !== undefined,
      'account: tem accountId': (r) => typeof r.json('accountId') === 'string'
    });

    accountQueries.add(1);
  });

  sleep(0.1);

  // ── Cenário 2: Transferência com valor aleatório baixo ───────────────────
  group('realizar transferência', () => {
    const amount = Math.floor(Math.random() * 15) + 1; // R$1–R$15

    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/transfer`,
      JSON.stringify({ toAccount: 'ACC-2002', amount }),
      { headers: authHeaders }
    );
    loginDuration.add(Date.now() - start);

    const ok = check(res, {
      'transfer: status esperado': (r) => [201, 409, 422].includes(r.status),
      'transfer: body JSON':       (r) => r.headers['Content-Type']?.includes('application/json')
    });

    transferSuccess.add(ok);
  });

  sleep(0.2);
}

// ---------------------------------------------------------------------------
// teardown(): executa UMA VEZ após todos os VUs — limpa estado do mock
// ---------------------------------------------------------------------------
export function teardown() {
  http.post(`${BASE_URL}/api/reset`, null, { headers: HEADERS });
}
