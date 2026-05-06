import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper to catch errors in async express routes and pass them to the error handler middleware.
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
