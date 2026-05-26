const form    = document.getElementById('login-form');
const message = document.getElementById('message');
const btn     = document.getElementById('login-button');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

let scrollTimeout;
let keyboardBootstrapDone = false;

const keepLoginVisible = () => {
  if (!form) return;
  window.clearTimeout(scrollTimeout);
  scrollTimeout = window.setTimeout(() => {
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 80);
};

[emailInput, passwordInput].forEach((input) => {
  input?.addEventListener('focus', keepLoginVisible);
  input?.addEventListener('input', keepLoginVisible);
});

document.addEventListener('keydown', (event) => {
  if (keyboardBootstrapDone || event.key !== 'Tab') return;

  const activeTag = document.activeElement?.tagName;
  if (activeTag === 'BODY' || activeTag === 'HTML' || !document.activeElement) {
    keyboardBootstrapDone = true;
    emailInput?.focus();
    event.preventDefault();
  }
}, true);

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  message.className = 'message';
  btn.textContent = 'Entrando...';
  btn.disabled = true;

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  btn.textContent = 'Entrar na conta';
  btn.disabled = false;

  if (!response.ok) {
    message.textContent = data.error || 'Falha no login';
    message.className = 'message error';
    return;
  }

  localStorage.setItem('fakebank.token', data.token);
  localStorage.setItem('fakebank.user', JSON.stringify(data.user));
  window.location.href = '/dashboard.html';
});
