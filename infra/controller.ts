import type { NextApiRequest, NextApiResponse } from 'next';
import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  ServiceError,
  UnauthorizedError,
  ValidationError,
} from 'infra/errors';
import session from 'models/session';

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

function onError(error: unknown, _req: NextApiRequest, res: NextApiResponse) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof UnauthorizedError ||
    error instanceof MethodNotAllowedError ||
    error instanceof ServiceError
  ) {
    return res.status(error.status_code).json(error.toJSON());
  }

  const internalError = new InternalServerError({ cause: error });
  console.error(error);
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
