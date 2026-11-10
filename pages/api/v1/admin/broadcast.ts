import type { NextApiResponse } from 'next';
import { getAnnouncement } from '@/lib/announcements';
import { assertAdmin } from 'infra/admin-guard';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import { ValidationError } from 'infra/errors';
import broadcastModel from 'models/broadcast';

export default authenticatedController({ GET: handleGet, POST: handlePost });

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  await assertAdmin(req);

  const key = typeof req.query.key === 'string' ? req.query.key : '';

  if (!key) {
    throw new ValidationError({
      message: 'Chave do anúncio é obrigatória.',
      action: 'Informe o parâmetro "key" na requisição.',
    });
  }

  const announcement = getAnnouncement(key);

  if (!announcement) {
    throw new ValidationError({
      message: 'Anúncio não encontrado.',
      action: 'Verifique a chave do anúncio e tente novamente.',
    });
  }

  const recipientCount = await broadcastModel.countRecipients(key);

  res.status(200).json({ announcement, recipientCount });
}

async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  await assertAdmin(req);

  const announcementKey =
    typeof req.body?.announcementKey === 'string'
      ? req.body.announcementKey
      : '';

  if (!announcementKey) {
    throw new ValidationError({
      message: 'Chave do anúncio é obrigatória.',
      action: 'Informe "announcementKey" no corpo da requisição.',
    });
  }

  if (!getAnnouncement(announcementKey)) {
    throw new ValidationError({
      message: 'Anúncio não encontrado.',
      action: 'Verifique a chave do anúncio e tente novamente.',
    });
  }

  const result = await broadcastModel.sendAnnouncement(announcementKey);

  res.status(200).json(result);
}
