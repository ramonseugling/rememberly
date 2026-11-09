import type { NextApiResponse } from 'next';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import giftVisibility from 'models/gift-visibility';

export default authenticatedController({ GET: handleGet });

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  res
    .status(200)
    .json({ owners: await giftVisibility.findVisibleOwners(req.user.id) });
}
