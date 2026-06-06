// Admin password — stored in this browser for this site URL only (e.g. localhost)
const ADMIN_PASS_KEY = 'nexus_admin_password';
const DEFAULT_ADMIN_PASS = 'nexus2024admin';

function getAdminPassword() {
  try {
    const stored = localStorage.getItem(ADMIN_PASS_KEY);
    if (stored === null) return DEFAULT_ADMIN_PASS;
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'string' && parsed.length > 0) return parsed;
    } catch (_) {
      if (stored.length > 0) return stored;
    }
    localStorage.removeItem(ADMIN_PASS_KEY);
  } catch (_) {}
  return DEFAULT_ADMIN_PASS;
}

function setAdminPassword(newPassword) {
  localStorage.setItem(ADMIN_PASS_KEY, JSON.stringify(String(newPassword)));
}

function checkAdminPassword(password) {
  return password === getAdminPassword();
}

async function requestAdminEmailCode(purpose) {
  const res = await fetch('/.netlify/functions/admin-send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purpose: purpose || 'reset' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || 'Could not send verification code.' };
  }
  return data;
}

async function verifyAdminEmailCode(code, purpose) {
  const res = await fetch('/.netlify/functions/admin-verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, purpose: purpose || 'reset' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || 'Verification failed.' };
  }
  return data;
}
