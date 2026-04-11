import { NextResponse } from 'next/server';
import dns from 'node:dns/promises';

export const runtime = 'nodejs';

const DISPOSABLE_DOMAINS = new Set([
  'yopmail.com','yopmail.fr','yopmail.net','jetable.org','jetable.net',
  'mailinator.com','mailinator.net','mailinator.org','guerrillamail.com','guerrillamail.net',
  'guerrillamail.org','guerrillamail.biz','guerrillamail.de','guerrillamailblock.com','sharklasers.com',
  'grr.la','10minutemail.com','10minutemail.net','tempmail.com','temp-mail.org','temp-mail.io',
  'tempmail.io','tempmailo.com','tempail.com','tempmailaddress.com','throwawaymail.com',
  'trashmail.com','trashmail.net','trashmail.de','trashmail.io','dispostable.com','fakeinbox.com',
  'fakemailgenerator.com','maildrop.cc','getnada.com','nada.email','mohmal.com','mintemail.com',
  'spamgourmet.com','spam4.me','inboxkitten.com','emailondeck.com','harakirimail.com','tempinbox.com',
  'temporarymail.com','mytemp.email','my10minutemail.com','33mail.com','spambox.us','spambog.com',
  'mailnesia.com','mailcatch.com','instantemailaddress.com','burnermail.io','anonbox.net',
  'discard.email','discardmail.com','fakemail.net','moakt.com','emailsensei.com','yopmail.pro',
  'tempmail.plus','mailtemp.info','mailpoof.com','mailtothis.com','tmpmail.org','tmail.ws',
  'byom.de','anonymmail.net','mailforspam.com','tempr.email','deadaddress.com','mail-temp.com',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function hasMxOrA(domain) {
  try {
    const mx = await dns.resolveMx(domain);
    if (mx.length > 0) return true;
  } catch {}
  try {
    const a = await dns.resolve4(domain);
    if (a.length > 0) return true;
  } catch {}
  return false;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 'error', message: 'Requête invalide.' }, { status: 400 });
  }

  const nom = String(body.nom || '').trim();
  const email = String(body.email || '').trim();
  const telephone = String(body.telephone || '').trim();
  const domaine = String(body.domaine || '').trim();

  if (!nom || !email || !telephone || !domaine) {
    return NextResponse.json({ status: 'error', message: 'Merci de remplir tous les champs.' });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ status: 'error', message: 'Email invalide.' });
  }

  const domain = email.split('@')[1].toLowerCase();

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return NextResponse.json({ status: 'disposable' });
  }

  if (!(await hasMxOrA(domain))) {
    return NextResponse.json({ status: 'error', message: "Ce domaine email n'existe pas." });
  }

  const GSHEET_URL = process.env.GSHEET_URL;
  if (!GSHEET_URL) {
    return NextResponse.json({ status: 'error', message: 'Configuration serveur manquante.' }, { status: 500 });
  }

  try {
    const res = await fetch(GSHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, email, telephone, domaine }),
      redirect: 'follow',
    });
    const json = await res.json().catch(() => ({}));

    if (json.status === 'duplicate') {
      return NextResponse.json({ status: 'duplicate' });
    }
    if (json.status !== 'ok') {
      return NextResponse.json({ status: 'error', message: 'Enregistrement échoué.' });
    }
  } catch {
    return NextResponse.json({ status: 'error', message: 'Impossible de joindre le service.' });
  }

  return NextResponse.json({ status: 'ok' });
}
