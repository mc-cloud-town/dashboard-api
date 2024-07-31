import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ResponseStatusCode } from './code';

export interface APIResponseBody<T> {
  code: ResponseStatusCode;
  data?: T;
}

export const sendRes = <T>(
  res: Response,
  body: APIResponseBody<T>,
  httpStatusCode = StatusCodes.OK,
) => {
  return res.status(httpStatusCode).json(body);
};
