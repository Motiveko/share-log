import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import type { NextFunction, Request, Response } from "express";

// TODO : middleware 방식이 필요할경우 사용
export function validationMiddleware<T extends object>(
  dtoClass: new () => T
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req, res, next) => {
    const dtoObject = plainToInstance(dtoClass, req.body);
    const errors = await validate(dtoObject, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      const messages = errors.map((err) =>
        Object.values(err.constraints || {}).join(", ")
      );

      res.status(400).json({ message: messages });
      return;
    }

    req.body = dtoObject;
    next();
  };
}
