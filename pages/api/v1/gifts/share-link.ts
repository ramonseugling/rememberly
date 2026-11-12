import type { NextApiResponse } from 'next';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import giftShare from 'models/gift-share';

export default authenticatedController({ GET: handleGet, POST: handlePost });

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  res
    .status(200)
    .json({ token: await giftShare.getOrCreateToken(req.user.id) });
}

// Replaces the code: links shared before stop working.
async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  res.status(200).json({ token: await giftShare.rotateToken(req.user.id) });
}
