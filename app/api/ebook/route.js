import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'private', 'ebook.pdf');
    const file = await readFile(filePath);
    return new Response(file, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Guide-Evenements-Prestige.pdf"',
        'Content-Length': String(file.length),
      },
    });
  } catch {
    return new Response('Ebook introuvable', { status: 404 });
  }
}
