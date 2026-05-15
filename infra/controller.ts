import type { NextApiRequest, NextApiResponse } from 'next';
import { log } from 'next-axiom';
import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  ServiceError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
} from 'infra/errors';
import session from 'models/session';
import systemLog from 'models/system-log';

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse,
) => Promise<void>;
type MethodHandlers = Partial<Record<string, Handler>>;
type AuthenticatedMethodHandlers = Partial<
  Record<string, AuthenticatedHandler>
>;

function onNoMatch(_req: NextApiRequest, res: NextApiResponse) {
  const error = new MethodNotAllowedError();
  res.status(error.status_code).json(error.toJSON());
}

function onError(error: unknown, req: NextApiRequest, res: NextApiResponse) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof UnauthorizedError ||
    error instanceof MethodNotAllowedError ||
    error instanceof ServiceError ||
    error instanceof TooManyRequestsError
  ) {
    return res.status(error.status_code).json(error.toJSON());
  }

  const internalError = new InternalServerError({ cause: error });
  log.error('internal_server_error', { error: String(error) });

  const maybeAuthUser = (req as AuthenticatedRequest).user;
  void systemLog.recordError({
    error,
    request_method: req.method ?? null,
    request_path: req.url ?? null,
    user_id: maybeAuthUser?.id ?? null,
  });

  return res.status(internalError.status_code).json(internalError.toJSON());
}

function controller(handlers: MethodHandlers) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = req.method?.toUpperCase();
    const handler = method ? handlers[method] : undefined;

    if (!handler) {
      return onNoMatch(req, res);
    }

    try {
      await handler(req, res);
    } catch (error) {
      onError(error, req, res);
    }
  };
}

function authenticatedController(handlers: AuthenticatedMethodHandlers) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = req.method?.toUpperCase();
    const handler = method ? handlers[method] : undefined;

    if (!handler) {
      return onNoMatch(req, res);
    }

    try {
      const token =
        req.cookies?.session_token ??
        req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new UnauthorizedError({
          message: 'Token de autenticação não fornecido.',
          action: 'Faça login para obter um token.',
        });
      }

      const foundSession = await session.findOneValidByToken(token);

      if (!foundSession) {
        throw new UnauthorizedError({
          message: 'Sessão inválida ou expirada.',
          action: 'Faça login novamente.',
        });
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: foundSession.user_id,
        name: foundSession.name,
        email: foundSession.email,
      };

      await handler(authenticatedReq, res);
    } catch (error) {
      onError(error, req, res);
    }
  };
}

export { authenticatedController };
export default controller;
