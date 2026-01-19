import { Expose, instanceToPlain, plainToInstance } from "class-transformer";
import { IsString } from "class-validator";
import {
  User as UserInterface,
  TokenDto as TokenInterface,
  JwtResponse,
} from "@repo/interfaces";
import { User } from "@repo/entities/user";

export class UserResponseDto implements UserInterface {
  @Expose()
  id: number;

  @Expose()
  displayName: string;

  @Expose()
  email: string;

  @Expose()
  avatarUrl: string;

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
  displayName: string;

  @Expose()
  avatarUrl: string;

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
