import crypto from 'node:crypto';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const buckets = new Map();

export function rateLimit(key) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_REQUESTS) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) {
    const cutoff = now - WINDOW_MS;
    for (const [k, v] of buckets) {
      const kept = v.filter((t) => t > cutoff);
      if (kept.length === 0) buckets.delete(k);
      else buckets.set(k, kept);
    }
  }
  return true;
}

export function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for') || '';
  return xff.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

export function sameOrigin(req) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function getSecret() {
  const s = process.env.EBOOK_TOKEN_SECRET;
  if (!s || s.length < 16) throw new Error('EBOOK_TOKEN_SECRET missing or too short');
  return s;
}

export function signToken(payload, ttlMs = 10 * 60_000) {
  const exp = Date.now() + ttlMs;
  const data = `${payload}.${exp}`;
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
  return `${Buffer.from(data).toString('base64url')}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const [dataB64, sig] = token.split('.');
  if (!dataB64 || !sig) return false;
  let data;
  try {
    data = Buffer.from(dataB64, 'base64url').toString('utf8');
  } catch {
    return false;
  }
  const expected = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const exp = Number(data.split('.').pop());
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return true;
}
