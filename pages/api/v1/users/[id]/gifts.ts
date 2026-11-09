import type { NextApiResponse } from 'next';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import giftVisibility from 'models/gift-visibility';

export default authenticatedController({ GET: handleGet });

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  res.status(200).json(await giftVisibility.findListForViewer(req.user.id, id));
}
