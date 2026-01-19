/* eslint-disable @typescript-eslint/no-empty-interface, @typescript-eslint/no-explicit-any -- for extends type */
import type { Request, Response, NextFunction, IRouter } from "express";
import type { ParsedQs } from "qs"; // For query string parameter typing
import type { UserDto } from "@api/features/user/dto";

// https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-modifying-module-d-ts.html
// 파일 명이 반드시 index.d.ts 여야함. 어떤걸 변경하는지는 directory명으로 구분한다.
// e.g. express.d.ts 로 하면 에러가 발생함
declare global {
  namespace Express {
    interface User extends UserDto {}
    type Request = SetRequired<Request, "user">;
  }
}

interface MessageResponse {
  message: string;
}

type DefaultResponse = MessageResponse;

export interface TypedRequest<T = unknown, V extends Record<string, any> = any>
  extends Request {
  body: T;
  params: V;
}

export type RequestWithBody<T> = TypedRequest<T>;

export type RequestWithParams<T extends Record<string, any>> = TypedRequest<
  unknown,
  T
>;

export interface AuthenticatedTypedRequest<
  T = unknown,
  V extends Record<string, any> = any,
> extends TypedRequest<T, V> {
  user: UserDto;
}

export interface AuthenticatedRequestWithParams<T extends Record<string, any>>
  extends AuthenticatedTypedRequest<unknown, T> {}

export type TypedResponse<T = DefaultResponse> = Response<T>;

export type TypedNextFunction = NextFunction;

export interface DataAndMessageResponse<T> extends MessageResponse {
  data: T;
}

// ==============
// PrivateRoute 직접 정의하기 위한 코드
// ==============
interface AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
  Locals extends Record<string, any> = Record<string, any>,
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
  user: UserDto; // 핵심: 'user' 속성이 반드시 존재하며 User 타입입니다.
}
type AuthenticatedRequestHandler<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
  Locals extends Record<string, any> = Record<string, any>,
> = (
  req: AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery, Locals>,
  res: Response<ResBody, Locals>,
  next: NextFunction
) => any; // 반환 타입은 void, Promise<void> 등이 될 수 있습니다.

type RouterMatcher = <
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
  Locals extends Record<string, any> = Record<string, any>,
>(
  path: string | RegExp | (string | RegExp)[],
  ...handlers: AuthenticatedRequestHandler<
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    Locals
  >[]
) => this;

/**
 * ✨ 인증된 요청을 기대하는 라우터 인터페이스
 * Router를 직접 정의해서 PrivateRoute를 단언으로 처리하지 않으면
 * req.user가 필수값이 되도록 할 방법이 없음.(매번 req.isAuthenticated() 처리해줘야한다.)
 */
export interface PrivateRoute extends IRouter {
  get: RouterMatcher;
  post: RouterMatcher;
  put: RouterMatcher;
  delete: RouterMatcher;
  patch: RouterMatcher;
  options: RouterMatcher;
  head: RouterMatcher;
  all: RouterMatcher;
  use: RouterMatcher &
    (<
      P = ParamsDictionary,
      ResBody = any,
      ReqBody = any,
      ReqQuery = ParsedQs,
      Locals extends Record<string, any> = Record<string, any>,
    >(
      ...handlers: AuthenticatedRequestHandler<
        P,
        ResBody,
        ReqBody,
        ReqQuery,
        Locals
      >[]
    ) => this);
}
