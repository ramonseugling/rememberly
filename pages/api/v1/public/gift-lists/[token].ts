import type { NextApiRequest, NextApiResponse } from 'next';
import controller from 'infra/controller';
import giftVisibility from 'models/gift-visibility';
import session from 'models/session';

export default controller({ GET: handleGet });

// Public: no login needed to read. A valid session only adds the viewer's own
// reservations.
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query as { token: string };
  const sessionToken =
    req.cookies?.session_token ??
    req.headers.authorization?.replace('Bearer ', '');
  const found = sessionToken
    ? await session.findOneValidByToken(sessionToken)
    : null;
  res
    .status(200)
    .json(await giftVisibility.findListByToken(token, found?.user_id ?? null));
}
