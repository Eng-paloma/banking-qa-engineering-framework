const token = localStorage.getItem('fakebank.token');
const user = JSON.parse(localStorage.getItem('fakebank.user') || '{}');

if (!token) window.location.href = '/';

const welcomeEl       = document.getElementById('welcome');
const balanceEl       = document.getElementById('balance');
const accountIdEl     = document.getElementById('account-id');
const avatarEl        = document.getElementById('avatar-initials');
const transferForm    = document.getElementById('transfer-form');
const transferMessage = document.getElementById('transfer-message');
const logoutButton    = document.getElementById('logout-button');
const txList          = document.getElementById('tx-list');

initHeader();

function fmt(value) {
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function initHeader() {
  const firstName = (user.name || 'Cliente').split(' ')[0];
  welcomeEl.textContent = firstName;
  avatarEl.textContent = (user.name || 'C').charAt(0).toUpperCase();
}

function authHeaders() {
  return { Authorization: `Bearer ${token}` };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return { response, data };
}

function setMessage(el, text, type) {
  el.textContent = text;
  el.className = `message ${type}`;
}

function renderTransactions(transactions, currentAccountId) {
  const recent = transactions.slice(-6).reverse();

  const totals = recent.reduce((accumulator, tx) => {
    const isDebit = tx.fromAccount === currentAccountId;
    accumulator[isDebit ? 'Saídas' : 'Entradas'] += Number(tx.amount) || 0;
    return accumulator;
  }, { Saídas: 0, Entradas: 0 });

  const amountValues = Object.values(totals).filter((value) => value > 0);
  const fallback = amountValues.length ? [] : [
    { label: 'Saídas', value: 62, color: '#ffdf00', detail: 'Transferências' },
    { label: 'Entradas', value: 28, color: '#009c3b', detail: 'Recebimentos' },
    { label: 'Reservas', value: 10, color: '#002776', detail: 'Saldo protegido' }
  ];

  const chartItems = fallback.length
    ? fallback
    : [
        { label: 'Saídas', value: totals['Saídas'], color: '#ffdf00', detail: 'Transferências enviadas' },
        { label: 'Entradas', value: totals['Entradas'], color: '#009c3b', detail: 'Valores recebidos' },
        { label: 'Reservas', value: Math.max(12, Math.round((totals['Saídas'] + totals['Entradas']) * 0.12)), color: '#002776', detail: 'Faixa simulada' }
      ];

  const total = chartItems.reduce((sum, item) => sum + item.value, 0) || 1;
  const centerLabel = recent[0]
    ? `Última: ${recent[0].fromAccount === currentAccountId ? 'Saída' : 'Entrada'}`
    : 'Movimentações simuladas';

  let sliceMarkup = '';
  let offset = 0;

  chartItems.forEach((item, index) => {
    const fraction = item.value / total;
    const dash = `${(fraction * 100).toFixed(2)} ${(100 - fraction * 100).toFixed(2)}`;
    const strokeOffset = (100 - offset) * 0.25;
    sliceMarkup += `<circle class="tx-chart-slice" tabindex="0" role="button" aria-label="${item.label} ${fmt(item.value)}" cx="110" cy="110" r="72" fill="none" stroke="${item.color}" stroke-width="44" stroke-dasharray="${dash}" stroke-dashoffset="${strokeOffset}" data-label="${item.label}" data-detail="${item.detail}" data-value="${fmt(item.value)}"></circle>`;
    offset += fraction * 100;
  });

  const legendMarkup = chartItems.map((item) => `
    <div class="tx-legend-item" data-label="${item.label}">
      <span class="tx-legend-swatch" style="background:${item.color}"></span>
      <span>${item.label}</span>
      <strong>${fmt(item.value)}</strong>
    </div>`).join('');

  txList.innerHTML = `
    <div class="tx-chart-wrap">
      <div class="tx-chart" id="tx-chart" role="img" aria-label="Gráfico de pizza das últimas movimentações">
        <svg viewBox="0 0 220 220" aria-hidden="true">
          ${sliceMarkup}
          <circle cx="110" cy="110" r="52" fill="#ffffff"></circle>
        </svg>
        <div class="tx-chart-center">
          <strong id="tx-chart-center-value">${recent.length ? fmt(recent[0].amount) : '0,00'}</strong>
          <span id="tx-chart-center-label">${centerLabel}</span>
        </div>
      </div>
      <div class="tx-legend">${legendMarkup}</div>
    </div>`;

  const chart = document.getElementById('tx-chart');
  const centerValue = document.getElementById('tx-chart-center-value');
  const centerLabelEl = document.getElementById('tx-chart-center-label');

  const highlightSlice = (slice) => {
    chart?.querySelectorAll('.tx-chart-slice').forEach((segment) => segment.classList.remove('is-active'));
    slice.classList.add('is-active');
    centerValue.textContent = slice.dataset.value || '0,00';
    centerLabelEl.textContent = `${slice.dataset.label} · ${slice.dataset.detail}`;
  };

  const firstSlice = chart?.querySelector('.tx-chart-slice');
  if (firstSlice) highlightSlice(firstSlice);

  chart?.querySelectorAll('.tx-chart-slice').forEach((slice) => {
    slice.addEventListener('mouseenter', () => highlightSlice(slice));
    slice.addEventListener('focus', () => highlightSlice(slice));
    slice.addEventListener('click', () => highlightSlice(slice));
    slice.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        highlightSlice(slice);
      }
    });
  });

  chart?.querySelectorAll('.tx-legend-item').forEach((item) => {
    item.addEventListener('mouseenter', () => {
      const label = item.getAttribute('data-label');
      const slice = chart.querySelector(`.tx-chart-slice[data-label="${label}"]`);
      if (slice) highlightSlice(slice);
    });
  });
}

async function loadAccount() {
  const [accountResult, txResult] = await Promise.all([
    fetchJson('/api/account', { headers: authHeaders() }),
    fetchJson('/api/transactions', { headers: authHeaders() })
  ]);

  if (accountResult.response.ok) {
    const account = accountResult.data;
    balanceEl.textContent  = fmt(account.balance);
    accountIdEl.textContent = `Conta ${account.accountId} · ${account.owner}`;
  } else {
    const err = accountResult.data;
    setMessage(transferMessage, err.error || 'Erro ao carregar conta', 'error');
  }

  const transactions = txResult.response.ok ? txResult.data.transactions || [] : [];
  renderTransactions(transactions, user.accountId);
}

transferForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(transferMessage, '', '');

  const toAccount = document.getElementById('toAccount').value.trim();
  const amount    = Number(document.getElementById('amount').value);

  const { response, data } = await fetchJson('/api/transfer', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ toAccount, amount })
  });

  if (!response.ok) {
    setMessage(transferMessage, data.error || 'Transferência falhou', 'error');
    return;
  }

  setMessage(transferMessage, 'Transferência realizada com sucesso!', 'success');
  balanceEl.textContent = fmt(data.balance);
  transferForm.reset();
  await loadAccount();
});

logoutButton?.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/';
});

loadAccount();
