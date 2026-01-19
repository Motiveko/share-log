import type { Profile } from "passport-google-oauth20";
import { TokenPayload } from "google-auth-library";
import { User } from "@repo/entities/user";

export class GoogleProfileDto {
  email: string;
  displayName?: string;
  avatarUrl?: string;

  static fromProfile(profile: Profile): GoogleProfileDto {
    if (!profile.emails) {
      throw new Error("이메일이 없습니다."); // 500;
    }
    const dto = new GoogleProfileDto();
    dto.email = profile.emails[0].value;
    dto.avatarUrl = profile.photos?.[0]?.value;
    dto.displayName = profile.displayName;

    return dto;
  }

  static fromTokenPayload(payload: TokenPayload): GoogleProfileDto {
    if (!payload.email) {
      throw new Error("google payload에 이메일이 없습니다.");
    }
    const dto = new GoogleProfileDto();
    dto.email = payload.email;
    dto.displayName = payload.name;
    dto.avatarUrl = payload.picture;
    return dto;
  }

  toEntity(): User {
    const user = new User();
    user.email = this.email;
    user.displayName = this.displayName;
    user.avatarUrl = this.avatarUrl;
    return user;
  }
}
