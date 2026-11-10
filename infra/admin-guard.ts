import { AuthenticatedRequest } from 'infra/controller';
import { UnauthorizedError } from 'infra/errors';
import session from 'models/session';

export async function assertAdmin(req: AuthenticatedRequest) {
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
}
