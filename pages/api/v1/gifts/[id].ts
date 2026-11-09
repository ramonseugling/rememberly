import type { NextApiResponse } from 'next';
import { parseSchema, updateGiftSchema } from '@/lib/validators';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import gift, { presentGiftItem } from 'models/gift';

export default authenticatedController({
  GET: handleGet,
  PATCH: handlePatch,
  DELETE: handleDelete,
});

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  res
    .status(200)
    .json(presentGiftItem(await gift.findItemById(req.user.id, id)));
}

async function handlePatch(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const changes = parseSchema(updateGiftSchema, req.body);
  const updated = await gift.updateItem(req.user.id, id, changes, {
    confirm: isConfirmed(req),
  });
  res.status(200).json(presentGiftItem(updated));
}

async function handleDelete(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  await gift.deleteItem(req.user.id, id, { confirm: isConfirmed(req) });
  res.status(204).end();
}

function isConfirmed(req: AuthenticatedRequest) {
  return req.query.confirm === 'true';
}
