import { Expose, instanceToPlain, plainToInstance } from "class-transformer";
import { IsString, IsOptional, MinLength, IsUrl } from "class-validator";
import {
  User as UserInterface,
  TokenDto as TokenInterface,
  JwtResponse,
  PatchUserDto as PatchUserDtoInterface,
} from "@repo/interfaces";
import { User } from "@repo/entities/user";

export class UserResponseDto implements UserInterface {
  @Expose()
  id: number;

  @Expose()
  nickname?: string;

  @Expose()
  email: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  slackWebhookUrl?: string;

  @Expose()
  isProfileComplete: boolean;

  @Expose()
  createdAt: Date;

  static fromEntity(entity: User) {
    return plainToInstance(UserResponseDto, entity, {
      excludeExtraneousValues: true,
    });
  }

  toJSON() {
    return instanceToPlain(this);
  }
}

// UserResponseDto랑 인터페이스가 같아서 이걸사용함
export class UserDto extends UserResponseDto {}

export class LoginDto {
  @IsString()
  email: string;

  toEntity() {
    const user = new User();
    user.email = this.email;
    return user;
  }
}

export class LoginAppRequestDto implements TokenInterface {
  @IsString()
  token: string;

  @IsString()
  clientId: string;
}

export class LoginAppResponseDto implements JwtResponse {
  @IsString()
  accessToken: string;

  @IsString()
  refreshToken?: string;
}

export class JwtPayloadDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  nickname?: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  isProfileComplete: boolean;

  @Expose()
  createdAt: Date;

  static fromEntity(entity: User) {
    return plainToInstance(JwtPayloadDto, entity, {
      excludeExtraneousValues: true,
    });
  }

  toJSON(): Record<string, any> {
    return instanceToPlain(this);
  }
}

export class PatchUserRequestDto implements PatchUserDtoInterface {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "닉네임은 최소 2자 이상이어야 합니다." })
  nickname?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: "유효한 URL 형식이어야 합니다." })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: "유효한 Slack 웹훅 URL 형식이어야 합니다." })
  slackWebhookUrl?: string;
}

export class SearchUserQueryDto {
  @IsString()
  @MinLength(1, { message: "검색어를 입력해주세요." })
  q: string;
}

export class SearchUserResponseDto {
  @Expose()
  id: number;

  @Expose()
  nickname?: string;

  @Expose()
  email: string;

  @Expose()
  avatarUrl?: string;

  static fromEntity(entity: User) {
    return plainToInstance(SearchUserResponseDto, entity, {
      excludeExtraneousValues: true,
    });
  }

  static fromEntities(entities: User[]) {
    return entities.map((entity) => SearchUserResponseDto.fromEntity(entity));
  }
}
