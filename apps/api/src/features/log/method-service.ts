import { singleton } from "tsyringe";
import { LogMethod } from "@repo/entities/log-method";
import { ERROR_CODES } from "@repo/interfaces";
import { MethodRepository } from "@api/features/log/method-repository";
import { NotFoundError } from "@api/errors/not-found";
import { BadRequestError } from "@api/errors/bad-request";
import type { CreateMethodDto, UpdateMethodDto } from "@repo/interfaces";

@singleton()
export class MethodService {
  constructor(private readonly methodRepository: MethodRepository) {}

  /**
   * 워크스페이스에 기본 수단 생성
   */
  async createDefaultMethods(workspaceId: number): Promise<LogMethod[]> {
    return this.methodRepository.createDefaultMethods(workspaceId);
  }

  /**
   * 수단 생성
   */
  async create(workspaceId: number, dto: CreateMethodDto): Promise<LogMethod> {
    // 중복 이름 체크
    const existing = await this.methodRepository.findByWorkspaceAndName(
      workspaceId,
      dto.name
    );
    if (existing) {
      throw new BadRequestError(
        "이미 동일한 이름의 수단이 존재합니다.",
        ERROR_CODES.DUPLICATE_METHOD_NAME
      );
    }

    const method = new LogMethod();
    method.workspaceId = workspaceId;
    method.name = dto.name;

    if (dto.sortOrder !== undefined) {
      method.sortOrder = dto.sortOrder;
    } else {
      const maxOrder = await this.methodRepository.getMaxSortOrder(workspaceId);
      method.sortOrder = maxOrder + 1;
    }

    return this.methodRepository.save(method);
  }

  /**
   * 워크스페이스의 수단 목록 조회
   */
  async findByWorkspace(workspaceId: number): Promise<LogMethod[]> {
    return this.methodRepository.findByWorkspaceId(workspaceId);
  }

  /**
   * 수단 수정
   */
  async update(
    workspaceId: number,
    methodId: number,
    dto: UpdateMethodDto
  ): Promise<LogMethod> {
    const method = await this.methodRepository.findById(methodId);
    if (!method || method.workspaceId !== workspaceId) {
      throw new NotFoundError(
        "수단을 찾을 수 없습니다.",
        ERROR_CODES.METHOD_NOT_FOUND
      );
    }

    // 이름 변경시 중복 체크
    if (dto.name !== undefined && dto.name !== method.name) {
      const existing = await this.methodRepository.findByWorkspaceAndName(
        workspaceId,
        dto.name
      );
      if (existing) {
        throw new BadRequestError(
          "이미 동일한 이름의 수단이 존재합니다.",
          ERROR_CODES.DUPLICATE_METHOD_NAME
        );
      }
      method.name = dto.name;
    }

    if (dto.sortOrder !== undefined) {
      method.sortOrder = dto.sortOrder;
    }

    return this.methodRepository.save(method);
  }

  /**
   * 수단 삭제 (MASTER만 가능, 기본 수단 삭제 불가)
   */
  async delete(workspaceId: number, methodId: number): Promise<void> {
    const method = await this.methodRepository.findById(methodId);
    if (!method || method.workspaceId !== workspaceId) {
      throw new NotFoundError(
        "수단을 찾을 수 없습니다.",
        ERROR_CODES.METHOD_NOT_FOUND
      );
    }

    // 기본 수단은 삭제 불가
    if (method.defaultType) {
      throw new BadRequestError(
        "기본 수단은 삭제할 수 없습니다.",
        ERROR_CODES.CANNOT_DELETE_DEFAULT_METHOD
      );
    }

    await this.methodRepository.remove(method);
  }
}
