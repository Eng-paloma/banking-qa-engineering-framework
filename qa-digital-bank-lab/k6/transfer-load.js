import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 30,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800']
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

function login() {
  const payload = JSON.stringify({
    email: 'alice@fakebank.com',
    password: 'Bank@123'
  });

  const response = http.post(`${BASE_URL}/api/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  check(response, {
    'login status 200': (r) => r.status === 200
  });

  return response.json('token');
}

export default function () {
  const token = login();
  if (!token) {
    sleep(1);
    return;
  }

  const amount = Math.floor(Math.random() * 20) + 1;
  const transferRes = http.post(
    `${BASE_URL}/api/transfer`,
    JSON.stringify({ toAccount: 'ACC-2002', amount }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }
  );

  check(transferRes, {
    'transfer status expected': (r) => [201, 409, 422].includes(r.status)
  });

  sleep(0.2);
}
