import type { NextApiResponse } from 'next';
import { createGiftSchema, parseSchema } from '@/lib/validators';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import gift, { MAX_GIFT_ITEMS, presentGiftItem } from 'models/gift';

export default authenticatedController({
  GET: handleGet,
  POST: handlePost,
});

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  const items = await gift.findItemsByUserId(req.user.id);
  res
    .status(200)
    .json({ items: items.map(presentGiftItem), limit: MAX_GIFT_ITEMS });
}

async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  const body = parseSchema(createGiftSchema, req.body);
  const created = await gift.createItem(req.user.id, body);
  res.status(201).json(presentGiftItem(created));
}
