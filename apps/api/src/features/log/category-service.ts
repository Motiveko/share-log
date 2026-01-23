import { singleton } from "tsyringe";
import { LogCategory } from "@repo/entities/log-category";
import { CategoryRepository } from "@api/features/log/category-repository";
import { NotFoundError } from "@api/errors/not-found";
import { BadRequestError } from "@api/errors/bad-request";
import type { CreateCategoryDto, UpdateCategoryDto } from "@repo/interfaces";

@singleton()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  /**
   * 카테고리 생성
   */
  async create(
    workspaceId: number,
    dto: CreateCategoryDto
  ): Promise<LogCategory> {
    // 중복 이름 체크
    const existing = await this.categoryRepository.findByWorkspaceAndName(
      workspaceId,
      dto.name
    );
    if (existing) {
      throw new BadRequestError("이미 동일한 이름의 카테고리가 존재합니다.");
    }

    const category = new LogCategory();
    category.workspaceId = workspaceId;
    category.name = dto.name;

    if (dto.sortOrder !== undefined) {
      category.sortOrder = dto.sortOrder;
    } else {
      const maxOrder = await this.categoryRepository.getMaxSortOrder(workspaceId);
      category.sortOrder = maxOrder + 1;
    }

    return this.categoryRepository.save(category);
  }

  /**
   * 워크스페이스의 카테고리 목록 조회
   */
  async findByWorkspace(workspaceId: number): Promise<LogCategory[]> {
    return this.categoryRepository.findByWorkspaceId(workspaceId);
  }

  /**
   * 카테고리 수정
   */
  async update(
    workspaceId: number,
    categoryId: number,
    dto: UpdateCategoryDto
  ): Promise<LogCategory> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category || category.workspaceId !== workspaceId) {
      throw new NotFoundError("카테고리를 찾을 수 없습니다.");
    }

    // 이름 변경시 중복 체크
    if (dto.name !== undefined && dto.name !== category.name) {
      const existing = await this.categoryRepository.findByWorkspaceAndName(
        workspaceId,
        dto.name
      );
      if (existing) {
        throw new BadRequestError("이미 동일한 이름의 카테고리가 존재합니다.");
      }
      category.name = dto.name;
    }

    if (dto.sortOrder !== undefined) {
      category.sortOrder = dto.sortOrder;
    }

    return this.categoryRepository.save(category);
  }

  /**
   * 카테고리 삭제 (MASTER만 가능)
   */
  async delete(workspaceId: number, categoryId: number): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category || category.workspaceId !== workspaceId) {
      throw new NotFoundError("카테고리를 찾을 수 없습니다.");
    }

    await this.categoryRepository.remove(category);
  }
}
