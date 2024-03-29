import { CustomContext } from '@/types/context';
import { userSchema, UserSchema } from './user';
import { TypedResponse } from 'hono';
import { ErrorResponse } from '@/types/response';
import { ZodError } from 'zod';
import { ErrorService } from '../service/error.service';

export { userSchema, UserSchema };

type ZodSuccess<T> = {
  success: true;
  data: T;
};

type ZodErr<T> = {
  success: false;
  error: ZodError<any>;
  data: T;
};

type ZodHookRes<T> = ZodSuccess<T> | ZodErr<T>;

/**
 * zodのバリデーション結果を返す
 * @param res
 * @param c Context
 * @returns
 */
export function zodHook<T, U extends CustomContext<string>>(
  res: ZodHookRes<T>,
  c: U,
): (Response & TypedResponse<ErrorResponse>) | void {
  if (res.success) return;

  const { issues } = res.error;
  const err = ErrorService.request.validationError(issues);
  return c.json(err.err, err.status);
}
