import type { NextApiResponse } from 'next';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import { UnauthorizedError } from 'infra/errors';
import admin from 'models/admin';
import session from 'models/session';

export default authenticatedController({ GET: handleGet });

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  const token =
    req.cookies?.session_token ??
    req.headers.authorization?.replace('Bearer ', '') ??
    '';

  const foundSession = await session.findOneValidByToken(token);

  if (!foundSession?.is_admin) {
    throw new UnauthorizedError({
      message: 'Acesso restrito a administradores.',
      action: 'Faça login com uma conta de administrador.',
    });
  }

  const stats = await admin.getStats();
  res.status(200).json(stats);
}
