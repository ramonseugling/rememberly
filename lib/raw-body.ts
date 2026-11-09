import type { NextApiRequest } from 'next';
import { ValidationError } from 'infra/errors';

export async function readRawBody(req: NextApiRequest, maxBytes: number) {
  const declared = Number(req.headers['content-length']);
  if (Number.isFinite(declared) && declared > maxBytes) throw tooLarge();
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw tooLarge();
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function tooLarge() {
  return new ValidationError({
    message: 'A imagem é grande demais.',
    action: 'Envie uma imagem de até 2 MB.',
  });
}
