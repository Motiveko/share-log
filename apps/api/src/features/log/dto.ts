import { Expose, instanceToPlain, plainToInstance } from "class-transformer";
import {
  IsString,
  IsOptional,
  MinLength,
  IsNumber,
  IsEnum,
  Min,
  IsDateString,
} from "class-validator";
import {
  type LogCategory as LogCategoryInterface,
  type LogMethod as LogMethodInterface,
  type LogWithRelations,
  type LogListQuery as LogListQueryInterface,
  type LogListResponse as LogListResponseInterface,
  type CreateLogDto as CreateLogDtoInterface,
  type UpdateLogDto as UpdateLogDtoInterface,
  type CreateCategoryDto as CreateCategoryDtoInterface,
  type UpdateCategoryDto as UpdateCategoryDtoInterface,
  type CreateMethodDto as CreateMethodDtoInterface,
  type UpdateMethodDto as UpdateMethodDtoInterface,
  type StatsQuery as StatsQueryInterface,
  type StatsResponse as StatsResponseInterface,
  type DailyStat,
  type MethodStat,
  type CategoryStat,
  type UserStat,
  type StatsSummary,
  LogType,
  DefaultMethodType,
} from "@repo/interfaces";
import { LogCategory } from "@repo/entities/log-category";
import { LogMethod } from "@repo/entities/log-method";
import { Log } from "@repo/entities/log";
import { Transform } from "class-transformer";

// Category DTOs
export class CategoryResponseDto implements LogCategoryInterface {
  @Expose()
  id: number;

  @Expose()
  workspaceId: number;

  @Expose()
  name: string;

  @Expose()
  sortOrder: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  static fromEntity(entity: LogCategory) {
    return plainToInstance(CategoryResponseDto, entity, {
      excludeExtraneousValues: true,
    });
  }

  static fromEntities(entities: LogCategory[]) {
    return entities.map((e) => CategoryResponseDto.fromEntity(e));
  }

  toJSON() {
    return instanceToPlain(this);
  }
}

export class CreateCategoryRequestDto implements CreateCategoryDtoInterface {
  @IsString()
  @MinLength(1, { message: "카테고리 이름을 입력해주세요." })
  name: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateCategoryRequestDto implements UpdateCategoryDtoInterface {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "카테고리 이름을 입력해주세요." })
  name?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

// Method DTOs
export class MethodResponseDto implements LogMethodInterface {
  @Expose()
  id: number;

  @Expose()
  workspaceId: number;

  @Expose()
  defaultType?: DefaultMethodType | null;

  @Expose()
  name: string;

  @Expose()
  sortOrder: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  static fromEntity(entity: LogMethod) {
    return plainToInstance(MethodResponseDto, entity, {
      excludeExtraneousValues: true,
    });
  }

  static fromEntities(entities: LogMethod[]) {
    return entities.map((e) => MethodResponseDto.fromEntity(e));
  }

  toJSON() {
    return instanceToPlain(this);
  }
}

export class CreateMethodRequestDto implements CreateMethodDtoInterface {
  @IsString()
  @MinLength(1, { message: "수단 이름을 입력해주세요." })
  name: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateMethodRequestDto implements UpdateMethodDtoInterface {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "수단 이름을 입력해주세요." })
  name?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

// Log DTOs
export class LogResponseDto implements LogWithRelations {
  @Expose()
  id: number;

  @Expose()
  workspaceId: number;

  @Expose()
  type: LogType;

  @Expose()
  categoryId?: number | null;

  @Expose()
  methodId?: number | null;

  @Expose()
  date: Date;

  @Expose()
  amount: number;

  @Expose()
  memo?: string | null;

  @Expose()
  userId: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  category?: LogCategoryInterface | null;

  @Expose()
  method?: LogMethodInterface | null;

  @Expose()
  user: {
    id: number;
    nickname?: string | null;
    avatarUrl?: string;
  };

  static fromEntity(entity: Log & { category?: LogCategory | null; method?: LogMethod | null }) {
    const dto = new LogResponseDto();
    dto.id = entity.id;
    dto.workspaceId = entity.workspaceId;
    dto.type = entity.type;
    dto.categoryId = entity.categoryId ?? null;
    dto.methodId = entity.methodId ?? null;
    dto.date = entity.date;
    dto.amount = Number(entity.amount);
    dto.memo = entity.memo ?? null;
    dto.userId = entity.userId;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.category = entity.category ? CategoryResponseDto.fromEntity(entity.category) : null;
    dto.method = entity.method ? MethodResponseDto.fromEntity(entity.method) : null;
    dto.user = {
      id: entity.user?.id ?? entity.userId,
      nickname: entity.user?.nickname ?? null,
      avatarUrl: entity.user?.avatarUrl,
    };
    return dto;
  }

  static fromEntities(entities: (Log & { category?: LogCategory | null; method?: LogMethod | null })[]) {
    return entities.map((e) => LogResponseDto.fromEntity(e));
  }

  toJSON() {
    return instanceToPlain(this);
  }
}

export class LogListResponseDto implements LogListResponseInterface {
  logs: LogWithRelations[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;

  static create(
    logs: (Log & { category?: LogCategory | null; method?: LogMethod | null })[],
    total: number,
    page: number,
    limit: number
  ): LogListResponseDto {
    const dto = new LogListResponseDto();
    dto.logs = LogResponseDto.fromEntities(logs);
    dto.total = total;
    dto.page = page;
    dto.limit = limit;
    dto.hasMore = page * limit < total;
    return dto;
  }
}

export class CreateLogRequestDto implements CreateLogDtoInterface {
  @IsEnum(LogType, { message: "유효한 로그 타입을 입력해주세요." })
  type: LogType;

  @IsNumber()
  @Min(0, { message: "금액은 0 이상이어야 합니다." })
  amount: number;

  @IsDateString({}, { message: "유효한 날짜 형식을 입력해주세요." })
  date: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  methodId?: number;
}

export class UpdateLogRequestDto implements UpdateLogDtoInterface {
  @IsOptional()
  @IsEnum(LogType, { message: "유효한 로그 타입을 입력해주세요." })
  type?: LogType;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: "금액은 0 이상이어야 합니다." })
  amount?: number;

  @IsOptional()
  @IsDateString({}, { message: "유효한 날짜 형식을 입력해주세요." })
  date?: string;

  @IsOptional()
  @IsString()
  memo?: string | null;

  @IsOptional()
  @IsNumber()
  categoryId?: number | null;

  @IsOptional()
  @IsNumber()
  methodId?: number | null;
}

export class LogListQueryDto implements LogListQueryInterface {
  @IsOptional()
  @IsDateString({}, { message: "유효한 시작 날짜 형식을 입력해주세요." })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: "유효한 종료 날짜 형식을 입력해주세요." })
  endDate?: string;

  @IsOptional()
  @IsEnum(LogType, { message: "유효한 로그 타입을 입력해주세요." })
  type?: LogType;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsNumber()
  userId?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsNumber()
  methodId?: number;

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

// Stats DTOs
export class StatsQueryDto implements StatsQueryInterface {
  @IsOptional()
  @IsDateString({}, { message: "유효한 시작 날짜 형식을 입력해주세요." })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: "유효한 종료 날짜 형식을 입력해주세요." })
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsNumber()
  userId?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsNumber()
  methodId?: number;
}

export class StatsResponseDto implements StatsResponseInterface {
  dailyData: DailyStat[];
  methodStats: MethodStat[];
  categoryStats: CategoryStat[];
  userStats: UserStat[];
  summary: StatsSummary;

  static create(
    dailyData: DailyStat[],
    methodStats: MethodStat[],
    categoryStats: CategoryStat[],
    userStats: UserStat[],
    summary: StatsSummary
  ): StatsResponseDto {
    const dto = new StatsResponseDto();
    dto.dailyData = dailyData;
    dto.methodStats = methodStats;
    dto.categoryStats = categoryStats;
    dto.userStats = userStats;
    dto.summary = summary;
    return dto;
  }
}
