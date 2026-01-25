import type { Response, NextFunction } from "express";
import { container } from "tsyringe";
import { MemberRepository } from "@api/features/workspace/member-repository";
import { ForbiddenError } from "@api/errors/forbidden";
import type { AuthenticatedRequest } from "@api/types/express";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WorkspaceParamsAny = any;

/**
 * 워크스페이스 멤버 검증 미들웨어
 * ACCEPTED 상태의 멤버만 접근 가능
 * 지원하는 파라미터: :id 또는 :workspaceId
 */
export const requireWorkspaceMember = async (
  req: AuthenticatedRequest<WorkspaceParamsAny>,
  _res: Response,
  next: NextFunction
) => {
  const workspaceId = parseInt(req.params.id || req.params.workspaceId || "", 10);
  const userId = req.user.id;

  if (isNaN(workspaceId)) {
    return next(new ForbiddenError("유효하지 않은 워크스페이스 ID입니다."));
  }

  const memberRepository = container.resolve(MemberRepository);
  const member = await memberRepository.findAcceptedByWorkspaceAndUser(
    workspaceId,
    userId
  );

  if (!member) {
    return next(new ForbiddenError("워크스페이스에 접근 권한이 없습니다."));
  }

  next();
};

/**
 * 워크스페이스 MASTER 권한 검증 미들웨어
 * MASTER 역할만 접근 가능
 * 지원하는 파라미터: :id 또는 :workspaceId
 */
export const requireWorkspaceMaster = async (
  req: AuthenticatedRequest<WorkspaceParamsAny>,
  _res: Response,
  next: NextFunction
) => {
  const workspaceId = parseInt(req.params.id || req.params.workspaceId || "", 10);
  const userId = req.user.id;

  if (isNaN(workspaceId)) {
    return next(new ForbiddenError("유효하지 않은 워크스페이스 ID입니다."));
  }

  const memberRepository = container.resolve(MemberRepository);
  const member = await memberRepository.findMasterByWorkspaceAndUser(
    workspaceId,
    userId
  );

  if (!member) {
    return next(new ForbiddenError("MASTER 권한이 필요합니다."));
  }

  next();
};
