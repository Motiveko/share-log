import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "@api/lib/jwt";
import { UserService } from "@api/features/user/service";
import { UnauthorizedError } from "@api/errors/un-authorized";
import { container } from "tsyringe";
import { RequestContextStore } from "@api/lib/request-context";
import { AuthenticatedRequest } from "@api/types/express";
import { UserDto } from "@api/features/user/dto";

const ensureAuthenticatedByJwt = async (
  req: Request,
  _: Response,
  __: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return false;
  }

  const payload = verifyToken(token);
  if (typeof payload === "object" && typeof payload.id === "number") {
    // Resolve UserService from DI container at runtime
    const userService = container.resolve(UserService);
    const user = await userService.getById(payload.id);
    if (user) {
      req.user = UserDto.fromEntity(user);
      return true;
    }
  }
  return false;
};

const enrichRequestContext = (authenticatedReq: AuthenticatedRequest) => {
  const requestContextStore = container.resolve(RequestContextStore);
  requestContextStore.setUser({
    userId: authenticatedReq.user.id,
    email: authenticatedReq.user.email,
  });
};
export const ensureAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 지금은 쓰지 않는인증 ( 세션인증 쓴다 )
  if (await ensureAuthenticatedByJwt(req, res, next)) {
    enrichRequestContext(req as AuthenticatedRequest);
    next();
    return;
  }

  // 세션인증, passport를 쓰면 자동생성
  if (req.isAuthenticated()) {
    enrichRequestContext(req);
    next();
    return;
  }

  next(new UnauthorizedError("Unauthorized: Login required"));
};
