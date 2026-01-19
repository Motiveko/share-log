import type { NextFunction, Request, Response } from "express";

type MethodHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

/** request handler(controller)에서 에러 발생시 next()로 전달해서 에러 핸들러로 보내질 수 있도록 하는 wrapper function */
const asyncHandler = (fn: MethodHandler, context: unknown): MethodHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    // fn.call을 통해서 context를 넘겨줘서 원래 컨텍스트를 유지하도록 함(this 바인딩 에러 방지)
    Promise.resolve(fn.call(context, req, res, next)).catch((e) => {
      next(e);
    });
  };
};

export function Controller() {
  return function wrapController(constructor: Function) {
    const methodNames = Object.getOwnPropertyNames(
      constructor.prototype
    ).filter(
      (name) =>
        name !== "constructor" &&
        typeof constructor.prototype[name] === "function"
    );

    for (const methodName of methodNames) {
      const originalMethod = constructor.prototype[methodName];
      constructor.prototype[methodName] = function (
        req: Request,
        res: Response,
        next: NextFunction
      ) {
        return asyncHandler(originalMethod, this)(req, res, next);
      };
    }
  };
}
