import type { NextApiRequest, NextApiResponse } from 'next';
import {
  InternalServerError,
  MethodNotAllowedError,
  UnauthorizedError,
  ValidationError,
  NotFoundError,
  ServiceError,
} from 'infra/errors';

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
type MethodHandlers = Partial<Record<string, Handler>>;

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

export default controller;
