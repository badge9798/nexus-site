import { CORS, json, hashCode, getOtpStore } from './_admin-otp.mjs';

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  let code = '';
  let purpose = 'reset';
  try {
    const body = await req.json();
    code = String(body.code || '').trim();
    purpose = body.purpose === 'change' ? 'change' : 'reset';
  } catch (_) {
    return json(400, { ok: false, error: 'Invalid request' });
  }

  if (!/^\d{6}$/.test(code)) {
    return json(400, { ok: false, error: 'Enter the 6-digit code from your email.' });
  }

  const store = getOtpStore();
  const key = `otp:${purpose}`;
  const raw = await store.get(key, { type: 'text' });
  if (!raw) {
    return json(400, { ok: false, error: 'No active code. Request a new verification code.' });
  }

  let record;
  try {
    record = JSON.parse(raw);
  } catch (_) {
    await store.delete(key);
    return json(400, { ok: false, error: 'Code expired. Request a new one.' });
  }

  if (!record.exp || Date.now() > record.exp) {
    await store.delete(key);
    return json(400, { ok: false, error: 'Code expired. Request a new one.' });
  }

  if (record.hash !== hashCode(code)) {
    return json(400, { ok: false, error: 'Incorrect verification code.' });
  }

  await store.delete(key);
  return json(200, { ok: true, verified: true });
};
