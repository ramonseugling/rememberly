interface ErrorResponse {
  name: string;
  message: string;
  action: string;
  status_code: number;
}

export class ValidationError extends Error {
  action: string;
  status_code: number;

  constructor({ message, action }: { message: string; action: string }) {
    super(message);
    this.name = 'ValidationError';
    this.action = action;
    this.status_code = 400;
  }

  toJSON(): ErrorResponse {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}

export class NotFoundError extends Error {
  action: string;
  status_code: number;

  constructor({ message, action }: { message: string; action: string }) {
    super(message);
    this.name = 'NotFoundError';
    this.action = action;
    this.status_code = 404;
  }

  toJSON(): ErrorResponse {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}

export class UnauthorizedError extends Error {
  action: string;
  status_code: number;

  constructor({ message, action }: { message: string; action: string }) {
    super(message);
    this.name = 'UnauthorizedError';
    this.action = action;
    this.status_code = 401;
  }

  toJSON(): ErrorResponse {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}

export class MethodNotAllowedError extends Error {
  action: string;
  status_code: number;

  constructor() {
    super('Método não permitido.');
    this.name = 'MethodNotAllowedError';
    this.action = 'Verifique o método HTTP utilizado.';
    this.status_code = 405;
  }

  toJSON(): ErrorResponse {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}

export class ServiceError extends Error {
  action: string;
  status_code: number;

  constructor({ message, action }: { message: string; action: string }) {
    super(message);
    this.name = 'ServiceError';
    this.action = action;
    this.status_code = 503;
  }

  toJSON(): ErrorResponse {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}

export class InternalServerError extends Error {
  action: string;
  status_code: number;

  constructor({ cause }: { cause?: unknown } = {}) {
    super('Erro interno do servidor.');
    this.name = 'InternalServerError';
    this.action = 'Tente novamente mais tarde.';
    this.status_code = 500;
    if (cause) this.cause = cause;
  }

  toJSON(): ErrorResponse {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}
