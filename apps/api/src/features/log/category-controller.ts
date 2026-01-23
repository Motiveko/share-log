import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { ValidateBody } from "@api/decorators/request-validator";
import { CategoryService } from "@api/features/log/category-service";
import {
  CategoryResponseDto,
  CreateCategoryRequestDto,
  UpdateCategoryRequestDto,
} from "@api/features/log/dto";
import type {
  AuthenticatedTypedRequest,
  TypedResponse,
  DataAndMessageResponse,
  MessageResponse,
} from "@api/types/express";
import type { LogCategory } from "@repo/interfaces";

interface WorkspaceParams {
  id: string;
}

interface CategoryParams extends WorkspaceParams {
  categoryId: string;
}

@singleton()
@Controller()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * POST /v1/workspaces/:id/categories - 카테고리 생성
   */
  @ValidateBody(CreateCategoryRequestDto)
  async create(
    req: AuthenticatedTypedRequest<CreateCategoryRequestDto, WorkspaceParams>,
    res: TypedResponse<DataAndMessageResponse<LogCategory>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const category = await this.categoryService.create(workspaceId, req.body);
    const dto = CategoryResponseDto.fromEntity(category);
    res.status(201).json({ message: "카테고리가 생성되었습니다.", data: dto });
  }

  /**
   * GET /v1/workspaces/:id/categories - 카테고리 목록 조회
   */
  async list(
    req: AuthenticatedTypedRequest<unknown, WorkspaceParams>,
    res: TypedResponse<DataAndMessageResponse<LogCategory[]>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const categories = await this.categoryService.findByWorkspace(workspaceId);
    const dto = CategoryResponseDto.fromEntities(categories);
    res.json({ message: "success", data: dto });
  }

  /**
   * PATCH /v1/workspaces/:id/categories/:categoryId - 카테고리 수정
   */
  @ValidateBody(UpdateCategoryRequestDto)
  async update(
    req: AuthenticatedTypedRequest<UpdateCategoryRequestDto, CategoryParams>,
    res: TypedResponse<DataAndMessageResponse<LogCategory>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const categoryId = parseInt(req.params.categoryId, 10);
    const category = await this.categoryService.update(
      workspaceId,
      categoryId,
      req.body
    );
    const dto = CategoryResponseDto.fromEntity(category);
    res.json({ message: "카테고리가 수정되었습니다.", data: dto });
  }

  /**
   * DELETE /v1/workspaces/:id/categories/:categoryId - 카테고리 삭제 (MASTER만)
   */
  async delete(
    req: AuthenticatedTypedRequest<unknown, CategoryParams>,
    res: TypedResponse<MessageResponse>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const categoryId = parseInt(req.params.categoryId, 10);
    await this.categoryService.delete(workspaceId, categoryId);
    res.json({ message: "카테고리가 삭제되었습니다." });
  }
}
