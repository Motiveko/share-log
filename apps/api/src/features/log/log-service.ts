import { singleton } from "tsyringe";
import { Log } from "@repo/entities/log";
import { LogRepository } from "@api/features/log/log-repository";
import { NotFoundError } from "@api/errors/not-found";
import { ForbiddenError } from "@api/errors/forbidden";
import type { CreateLogDto, UpdateLogDto, LogListQuery } from "@repo/interfaces";

@singleton()
export class LogService {
  constructor(private readonly logRepository: LogRepository) {}

  /**
   * 로그 생성
   */
  async create(
    workspaceId: number,
    userId: number,
    dto: CreateLogDto
  ): Promise<Log> {
    const log = new Log();
    log.workspaceId = workspaceId;
    log.userId = userId;
    log.type = dto.type;
    log.amount = dto.amount;
    log.date = new Date(dto.date);
    log.memo = dto.memo;
    log.categoryId = dto.categoryId;
    log.methodId = dto.methodId;

    const saved = await this.logRepository.save(log);
    return this.logRepository.findById(saved.id) as Promise<Log>;
  }

  /**
   * 워크스페이스의 로그 목록 조회 (필터, 페이지네이션)
   */
  async findByWorkspace(workspaceId: number, query: LogListQuery) {
    return this.logRepository.findByWorkspaceWithFilter(workspaceId, query);
  }

  /**
   * 로그 상세 조회
   */
  async findById(
    workspaceId: number,
    logId: number
  ): Promise<Log> {
    const log = await this.logRepository.findById(logId);
    if (!log || log.workspaceId !== workspaceId) {
      throw new NotFoundError("로그를 찾을 수 없습니다.");
    }
    return log;
  }

  /**
   * 로그 수정 (본인만 가능)
   */
  async update(
    workspaceId: number,
    logId: number,
    userId: number,
    dto: UpdateLogDto
  ): Promise<Log> {
    const log = await this.logRepository.findById(logId);
    if (!log || log.workspaceId !== workspaceId) {
      throw new NotFoundError("로그를 찾을 수 없습니다.");
    }

    if (log.userId !== userId) {
      throw new ForbiddenError("본인이 작성한 로그만 수정할 수 있습니다.");
    }

    if (dto.type !== undefined) log.type = dto.type;
    if (dto.amount !== undefined) log.amount = dto.amount;
    if (dto.date !== undefined) log.date = new Date(dto.date);
    if (dto.memo !== undefined) log.memo = dto.memo ?? undefined;
    if (dto.categoryId !== undefined) log.categoryId = dto.categoryId ?? undefined;
    if (dto.methodId !== undefined) log.methodId = dto.methodId ?? undefined;

    const saved = await this.logRepository.save(log);
    return this.logRepository.findById(saved.id) as Promise<Log>;
  }

  /**
   * 로그 삭제 (본인만 가능)
   */
  async delete(
    workspaceId: number,
    logId: number,
    userId: number
  ): Promise<void> {
    const log = await this.logRepository.findById(logId);
    if (!log || log.workspaceId !== workspaceId) {
      throw new NotFoundError("로그를 찾을 수 없습니다.");
    }

    if (log.userId !== userId) {
      throw new ForbiddenError("본인이 작성한 로그만 삭제할 수 있습니다.");
    }

    await this.logRepository.remove(log);
  }
}
