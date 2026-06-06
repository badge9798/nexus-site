import nodemailer from 'nodemailer';
import { CORS, json, hashCode, getOtpStore, maskEmail } from './_admin-otp.mjs';

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  const adminEmail = process.env.ADMIN_EMAIL;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!adminEmail || !gmailUser || !gmailPass) {
    return json(503, { ok: false, error: 'Email verification is not configured. Add ADMIN_EMAIL, GMAIL_USER, and GMAIL_APP_PASSWORD in Netlify.' });
  }

  let purpose = 'reset';
  try {
    const body = await req.json();
    purpose = body.purpose === 'change' ? 'change' : 'reset';
  } catch (_) {}

  const store = getOtpStore();
  const rateKey = `rate:${purpose}`;
  const rateRaw = await store.get(rateKey, { type: 'text' });
  if (rateRaw) {
    const last = parseInt(rateRaw, 10);
    if (!Number.isNaN(last) && Date.now() - last < 60000) {
      return json(429, { ok: false, error: 'Please wait 1 minute before requesting another code.' });
    }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const exp = Date.now() + 10 * 60 * 1000;
  await store.set(`otp:${purpose}`, JSON.stringify({ hash: hashCode(code), exp }));
  await store.set(rateKey, String(Date.now()));

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });
    await transporter.sendMail({
      from: `NEXUS Admin <${gmailUser}>`,
      to: adminEmail,
      subject: 'NEXUS admin verification code',
      text: `Your NEXUS admin verification code is: ${code}\n\nIt expires in 10 minutes.\nIf you did not request this, you can ignore this email.`,
    });
  } catch (err) {
    console.error('admin-send-code email error', err);
    return json(500, { ok: false, error: 'Could not send email. Check Gmail app password settings in Netlify.' });
  }

  return json(200, { ok: true, message: `Verification code sent to ${maskEmail(adminEmail)}` });
};
