import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { verifyToken, rateLimit, getClientIp } from '../../lib/security.js';

export const runtime = 'nodejs';

export async function GET(req) {
  const ip = getClientIp(req);
  if (!rateLimit(`ebook:${ip}`)) {
    return new Response('Trop de requêtes.', { status: 429 });
  }

  const token = new URL(req.url).searchParams.get('t');
  if (!verifyToken(token)) {
    return new Response('Accès non autorisé.', { status: 403 });
  }

  try {
    const filePath = path.join(process.cwd(), 'private', 'ebook.pdf');
    const file = await readFile(filePath);
    return new Response(file, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Guide-Evenements-Prestige.pdf"',
        'Content-Length': String(file.length),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Ebook introuvable', { status: 404 });
  }
}
