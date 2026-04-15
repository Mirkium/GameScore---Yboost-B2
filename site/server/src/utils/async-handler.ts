import type { NextFunction, Request, Response, RequestHandler } from "express";

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export const asyncHandler = (controller: AsyncController): RequestHandler => {
  return (req, res, next) => {
    void Promise.resolve(controller(req, res, next)).catch(next);
  };
};