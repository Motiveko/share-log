import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import type { Request, Response, NextFunction } from "express";
import { ValidationError } from "@api/errors/validation";

export function ValidateBody<T extends object>(dtoClass: new () => T) {
  return function validateBody(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function RequestHandlerWithValidation(
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      const dtoObject = plainToInstance(dtoClass, req.body);
      const errors = await validate(dtoObject, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      if (errors.length > 0) {
        const messages = errors
          .map((err) => Object.values(err.constraints || {}))
          .join(", ");

        throw new ValidationError(messages);
      }
      req.body = dtoObject;

      // eslint-disable-next-line -- 타입 검증 통과 후 원래 핸들러 실행
      return originalMethod.apply(this, [req, res, next]);
    };
  };
}

export function ValidateParams<T extends Record<string, any>>(
  dtoClass: new () => T
) {
  return function validateParams(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function RequestHandlerWithValidation(
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      const dtoObject = plainToInstance(dtoClass, req.params);
      const errors = await validate(dtoObject, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      if (errors.length > 0) {
        const messages = errors
          .map((err) => Object.values(err.constraints || {}))
          .join(", ");
        throw new ValidationError(messages);
      }

      req.params = dtoObject;

      // eslint-disable-next-line -- 타입 검증 통과 후 원래 핸들러 실행
      return originalMethod.apply(this, [req, res, next]);
    };
  };
}

export function ValidateQuery<T extends Record<string, any>>(
  dtoClass: new () => T
) {
  return function validateQuery(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function RequestHandlerWithValidation(
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      const dtoObject = plainToInstance(dtoClass, req.query);
      const errors = await validate(dtoObject, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      if (errors.length > 0) {
        const messages = errors
          .map((err) => Object.values(err.constraints || {}))
          .join(", ");
        throw new ValidationError(messages);
      }

      req.query = dtoObject;

      // eslint-disable-next-line -- 타입 검증 통과 후 원래 핸들러 실행
      return originalMethod.apply(this, [req, res, next]);
    };
  };
}
