import type { NextApiResponse } from 'next';
import { readRawBody } from '@/lib/raw-body';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import { ValidationError } from 'infra/errors';
import photo, { MAX_PHOTO_BYTES } from 'models/photo';

export const config = { api: { bodyParser: false } };

export default authenticatedController({
  PUT: handlePut,
  DELETE: handleDelete,
});

async function handlePut(req: AuthenticatedRequest, res: NextApiResponse) {
  const type = req.headers['content-type']?.split(';')[0]?.trim().toLowerCase();
  if (!type || !type.startsWith('image/')) {
    throw new ValidationError({
      message: 'Formato de imagem inválido.',
      action: 'Envie uma imagem JPEG, PNG ou WebP de até 2 MB.',
    });
  }
  const body = await readRawBody(req, MAX_PHOTO_BYTES);
  res.status(200).json(await photo.setUserAvatar(req.user.id, body));
}

async function handleDelete(req: AuthenticatedRequest, res: NextApiResponse) {
  await photo.removeUserAvatar(req.user.id);
  res.status(204).end();
}
