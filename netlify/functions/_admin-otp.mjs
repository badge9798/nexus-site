import crypto from 'crypto';
import { getStore } from '@netlify/blobs';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export function hashCode(code) {
  const secret = process.env.ADMIN_OTP_SECRET || process.env.GMAIL_APP_PASSWORD || 'nexus-otp';
  return crypto.createHmac('sha256', secret).update(String(code).trim()).digest('hex');
}

export function getOtpStore() {
  return getStore('nexus-admin-otp');
}

export function maskEmail(email) {
  const [user, domain] = String(email).split('@');
  if (!domain) return 'owner email';
  const visible = user.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(3, user.length - 2))}@${domain}`;
}
