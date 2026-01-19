import passport from "passport";
import type { Profile } from "passport-google-oauth20";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { RequestHandler } from "express";
import { Config } from "@api/config/env";
import { container } from "@api/container";
import { UserService } from "@api/features/user/service";
import { GoogleProfileDto } from "@api/features/user/google-profile-dto";
import { UserDto } from "@api/features/user/dto";

let isConfigured = false;

/**
 * Passport를 설정합니다.
 * DI 컨테이너가 초기화된 후에 호출되어야 합니다.
 */
export const configurePassport = () => {
  if (isConfigured) return;

  const userService = container.resolve(UserService);

  passport.use(
    new GoogleStrategy(
      {
        clientID: Config.GOOGLE_CLIENT_ID,
        clientSecret: Config.GOOGLE_CLIENT_SECRET,
        callbackURL: Config.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile: Profile, done) => {
        try {
          // DB에서 사용자 찾거나 생성
          // TODO : auth provider 정보 저장
          const user = await userService.findOrCreate(
            GoogleProfileDto.fromProfile(profile)
          );
          done(null, UserDto.fromEntity(user));
        } catch (error) {
          done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    // user 객체를 세션에 저장 (DB 재조회 방지)
    // express-session이 JSON 직렬화하므로 plain object로 저장됨
    done(null, user);
  });

  passport.deserializeUser((sessionUser: Express.User, done) => {
    // 세션에 저장된 user 정보를 그대로 사용 (DB 조회 없음)
    done(null, sessionUser);
  });

  isConfigured = true;
};

export const passportMiddleware = passport.initialize();
export const passportSession = passport.session();
export const googleLoginHandler = passport.authenticate("google", {
  scope: ["email", "profile"],
}) as RequestHandler;
export const googleCallbackAuthenticate = passport.authenticate("google", {
  successRedirect: Config.FRONTEND_URL,
  failureRedirect: `${Config.FRONTEND_URL}/login`,
}) as RequestHandler;
