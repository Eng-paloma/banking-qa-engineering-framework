const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const path = require('path');
const { v4: uuid } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fake-bank-secret';
const LOCKOUT_THRESHOLD = 3;
const LOCKOUT_MS = 60_000;

// ---------------------------------------------------------------------------
// Chaos Mode — simula instabilidade de rede/serviço
// Ativado via CHAOS_MODE=true ou POST /api/chaos { "enabled": true }
// ---------------------------------------------------------------------------
const chaos = {
  enabled: process.env.CHAOS_MODE === 'true',
  errorRate: Number(process.env.CHAOS_ERROR_RATE || 0.3),   // 30% de 503
  slowRate:  Number(process.env.CHAOS_SLOW_RATE  || 0.2),   // 20% de req lentas
  slowMs:    Number(process.env.CHAOS_SLOW_MS    || 2000)   // delay extra em ms
};

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Chaos middleware — aplicado apenas em rotas /api/* (exceto /api/reset e /api/chaos)
// ---------------------------------------------------------------------------
app.use('/api', (req, res, next) => {
  if (!chaos.enabled) return next();
  if (['/api/reset', '/api/chaos'].includes(req.path)) return next();

  // Slow response
  if (Math.random() < chaos.slowRate) {
    return sleep(chaos.slowMs).then(() => next());
  }

  // Random 503
  if (Math.random() < chaos.errorRate) {
    return res.status(503).json({ error: 'Service temporarily unavailable (chaos mode)' });
  }

  next();
});

const baseState = {
  users: {
    'alice@fakebank.com': {
      password: 'Bank@123',
      accountId: 'ACC-1001',
      name: 'Alice Silva'
    },
    'bob@fakebank.com': {
      password: 'Bank@123',
      accountId: 'ACC-2002',
      name: 'Bob Santos'
    }
  },
  accounts: {
    'ACC-1001': { accountId: 'ACC-1001', owner: 'Alice Silva', balance: 1200.0 },
    'ACC-2002': { accountId: 'ACC-2002', owner: 'Bob Santos', balance: 800.0 }
  },
  transactions: [],
  loginAttempts: {},
  accountLocks: new Set()
};

let state = JSON.parse(JSON.stringify(baseState));
state.accountLocks = new Set();

function resetState() {
  state = JSON.parse(JSON.stringify(baseState));
  state.accountLocks = new Set();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simulateDelay() {
  const min = Number(process.env.API_DELAY_MIN || 40);
  const max = Number(process.env.API_DELAY_MAX || 150);
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await sleep(delay);
}

function isLikelyInjection(value = '') {
  return /('|"|;|--|\/\*|\*\/|\bor\b|\band\b|1=1|select|union|drop|insert|update)/i.test(value);
}

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/api/reset', (_req, res) => {
  resetState();
  res.status(200).json({ message: 'State reset' });
});

// Toggle chaos mode em runtime — útil para testes de resiliência
app.post('/api/chaos', (req, res) => {
  const { enabled, errorRate, slowRate, slowMs } = req.body || {};
  if (typeof enabled === 'boolean') chaos.enabled = enabled;
  if (typeof errorRate === 'number') chaos.errorRate = errorRate;
  if (typeof slowRate  === 'number') chaos.slowRate  = slowRate;
  if (typeof slowMs    === 'number') chaos.slowMs    = slowMs;
  res.status(200).json({ chaos });
});

// Diagnóstico do estado interno — útil para debugging de testes
app.get('/api/diagnostics', (_req, res) => {
  res.status(200).json({
    chaos,
    accounts: Object.fromEntries(
      Object.entries(state.accounts).map(([id, acc]) => [id, { balance: acc.balance }])
    ),
    transactionsCount: state.transactions.length,
    lockedAccounts: [...state.accountLocks]
  });
});

app.post('/api/auth/login', async (req, res) => {
  await simulateDelay();

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (isLikelyInjection(email) || isLikelyInjection(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const attempt = state.loginAttempts[email] || { count: 0, blockedUntil: 0 };

  if (attempt.blockedUntil > Date.now()) {
    const retryAfter = Math.ceil((attempt.blockedUntil - Date.now()) / 1000);
    return res.status(429).json({ error: 'Too many attempts', retryAfter });
  }

  const user = state.users[email];
  if (!user || user.password !== password) {
    attempt.count += 1;
    if (attempt.count >= LOCKOUT_THRESHOLD) {
      attempt.blockedUntil = Date.now() + LOCKOUT_MS;
      attempt.count = 0;
    }
    state.loginAttempts[email] = attempt;
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  state.loginAttempts[email] = { count: 0, blockedUntil: 0 };
  const token = jwt.sign({ sub: user.accountId, email }, JWT_SECRET, { expiresIn: '30m' });

  return res.status(200).json({
    token,
    user: {
      email,
      name: user.name,
      accountId: user.accountId
    }
  });
});

app.get('/api/account', auth, async (req, res) => {
  await simulateDelay();
  const account = state.accounts[req.user.sub];
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  return res.status(200).json(account);
});

app.get('/api/transactions', auth, async (req, res) => {
  await simulateDelay();
  const accountId = req.user.sub;
  const list = state.transactions.filter(
    (t) => t.fromAccount === accountId || t.toAccount === accountId
  );
  return res.status(200).json({ transactions: list });
});

app.post('/api/transfer', auth, async (req, res) => {
  await simulateDelay();

  const fromAccount = req.user.sub;
  const { toAccount, amount } = req.body || {};

  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    return res.status(422).json({ error: 'Invalid transfer amount' });
  }

  if (!toAccount || !state.accounts[toAccount] || toAccount === fromAccount) {
    return res.status(422).json({ error: 'Invalid destination account' });
  }

  if (state.accountLocks.has(fromAccount)) {
    return res.status(409).json({ error: 'Concurrent transaction detected' });
  }

  state.accountLocks.add(fromAccount);

  try {
    await sleep(120);

    const origin = state.accounts[fromAccount];
    const destination = state.accounts[toAccount];

    if (!origin || !destination) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (origin.balance < amount) {
      return res.status(409).json({ error: 'Insufficient funds' });
    }

    origin.balance = Number((origin.balance - amount).toFixed(2));
    destination.balance = Number((destination.balance + amount).toFixed(2));

    const transaction = {
      id: uuid(),
      fromAccount,
      toAccount,
      amount,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED'
    };

    state.transactions.push(transaction);
    return res.status(201).json({ message: 'Transfer successful', transaction, balance: origin.balance });
  } finally {
    state.accountLocks.delete(fromAccount);
  }
});

const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Fake Bank server running at http://localhost:${PORT}`);
});
