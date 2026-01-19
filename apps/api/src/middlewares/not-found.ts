import { RequestHandler } from "express";
import { NotFoundError } from "@api/errors/not-found";

export const notFoundMiddleware: RequestHandler = (req, res, next) => {
  next(new NotFoundError(`${req.method} ${req.url} not found`));
};
