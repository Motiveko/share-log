import { Expose, instanceToPlain } from "class-transformer";
import {
  IsString,
  IsOptional,
  MinLength,
  IsNumber,
  IsEnum,
  Min,
  IsDateString,
  IsArray,
} from "class-validator";
import { Transform } from "class-transformer";
import {
  type AdjustmentWithCreator,
  type AdjustmentListQuery as AdjustmentListQueryInterface,
  type AdjustmentListResponse as AdjustmentListResponseInterface,
  type CreateAdjustmentDto as CreateAdjustmentDtoInterface,
  type UpdateAdjustmentDto as UpdateAdjustmentDtoInterface,
  type AdjustmentResult,
  AdjustmentStatus,
} from "@repo/interfaces";
import { Adjustment } from "@repo/entities/adjustment";

// Response DTO
export class AdjustmentResponseDto implements AdjustmentWithCreator {
  @Expose()
  id: number;

  @Expose()
  workspaceId: number;

  @Expose()
  name: string;

  @Expose()
  startDate: Date;

  @Expose()
  endDate: Date;

  @Expose()
  categoryIds: number[];

  @Expose()
  methodIds: number[];

  @Expose()
  participantIds: number[];

  @Expose()
  status: AdjustmentStatus;

  @Expose()
  result?: AdjustmentResult;

  @Expose()
  creatorId: number;

  @Expose()
  completedAt?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  creator: {
    id: number;
    nickname?: string | null;
    avatarUrl?: string;
  };

  static fromEntity(entity: Adjustment): AdjustmentResponseDto {
    const dto = new AdjustmentResponseDto();
    dto.id = entity.id;
    dto.workspaceId = entity.workspaceId;
    dto.name = entity.name;
    dto.startDate = entity.startDate;
    dto.endDate = entity.endDate;
    dto.categoryIds = entity.categoryIds ?? [];
    dto.methodIds = entity.methodIds ?? [];
    dto.participantIds = entity.participantIds ?? [];
    dto.status = entity.status;
    dto.result = entity.result;
    dto.creatorId = entity.creatorId;
    dto.completedAt = entity.completedAt;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.creator = {
      id: entity.creator?.id ?? entity.creatorId,
      nickname: entity.creator?.nickname ?? null,
      avatarUrl: entity.creator?.avatarUrl,
    };
    return dto;
  }

  static fromEntities(entities: Adjustment[]): AdjustmentResponseDto[] {
    return entities.map((e) => AdjustmentResponseDto.fromEntity(e));
  }

  toJSON() {
    return instanceToPlain(this);
  }
}

export class AdjustmentListResponseDto implements AdjustmentListResponseInterface {
  adjustments: AdjustmentWithCreator[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;

  static create(
    adjustments: Adjustment[],
    total: number,
    page: number,
    limit: number
  ): AdjustmentListResponseDto {
    const dto = new AdjustmentListResponseDto();
    dto.adjustments = AdjustmentResponseDto.fromEntities(adjustments);
    dto.total = total;
    dto.page = page;
    dto.limit = limit;
    dto.hasMore = page * limit < total;
    return dto;
  }
}

// Request DTOs
export class CreateAdjustmentRequestDto implements CreateAdjustmentDtoInterface {
  @IsString()
  @MinLength(1, { message: "정산 이름을 입력해주세요." })
  name: string;

  @IsDateString({}, { message: "유효한 시작 날짜 형식을 입력해주세요." })
  startDate: string;

  @IsDateString({}, { message: "유효한 종료 날짜 형식을 입력해주세요." })
  endDate: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  methodIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  participantIds?: number[];
}

export class UpdateAdjustmentRequestDto implements UpdateAdjustmentDtoInterface {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "정산 이름을 입력해주세요." })
  name?: string;

  @IsOptional()
  @IsDateString({}, { message: "유효한 시작 날짜 형식을 입력해주세요." })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: "유효한 종료 날짜 형식을 입력해주세요." })
  endDate?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  methodIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  participantIds?: number[];
}

export class AdjustmentListQueryDto implements AdjustmentListQueryInterface {
  @IsOptional()
  @IsEnum(AdjustmentStatus, { message: "유효한 정산 상태를 입력해주세요." })
  status?: AdjustmentStatus;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 20))
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
