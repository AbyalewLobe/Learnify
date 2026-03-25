/**
 * Custom error classes for application-specific errors
 */

export class ConflictError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.code = 'CONFLICT';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.code = 'NOT_FOUND';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
    this.statusCode = 400;
    this.code = 'BAD_REQUEST';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InternalServerError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string) {
    super(message);
    this.name = 'InternalServerError';
    this.statusCode = 500;
    this.code = 'INTERNAL_ERROR';
    Error.captureStackTrace(this, this.constructor);
  }
}
