import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import {
  UserResponseDto,
  PatchUserRequestDto,
  SearchUserQueryDto,
  SearchUserResponseDto,
} from "@api/features/user/dto";
import type {
  DataAndMessageResponse,
  AuthenticatedTypedRequest,
  TypedResponse,
  MessageResponse,
} from "@api/types/express";
import { ValidateBody, ValidateQuery } from "@api/decorators/request-validator";
import { UserService } from "@api/features/user/service";

@singleton()
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  async get(
    req: AuthenticatedTypedRequest,
    res: TypedResponse<DataAndMessageResponse<UserResponseDto>>
  ) {
    // 세션의 user 대신 DB에서 최신 정보 조회
    const user = await this.userService.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다.", data: null as any });
    }
    const dto = UserResponseDto.fromEntity(user);
    res.json({ message: "success", data: dto });
  }

  @ValidateBody(PatchUserRequestDto)
  async patch(
    req: AuthenticatedTypedRequest<PatchUserRequestDto>,
    res: TypedResponse<DataAndMessageResponse<UserResponseDto>>
  ) {
    const user = await this.userService.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다.", data: null as any });
    }
    const updatedUser = await this.userService.update(user, req.body);
    const dto = UserResponseDto.fromEntity(updatedUser);
    res.json({ message: "프로필이 수정되었습니다.", data: dto });
  }

  async delete(
    req: AuthenticatedTypedRequest,
    res: TypedResponse<MessageResponse>
  ) {
    await this.userService.deleteById(req.user.id);
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "로그아웃 중 오류가 발생했습니다." });
      }
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          return res.status(500).json({ message: "세션 삭제 중 오류가 발생했습니다." });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "회원 탈퇴가 완료되었습니다." });
      });
    });
  }

  @ValidateQuery(SearchUserQueryDto)
  async search(
    req: AuthenticatedTypedRequest<unknown, any, SearchUserQueryDto>,
    res: TypedResponse<DataAndMessageResponse<SearchUserResponseDto[]>>
  ) {
    const users = await this.userService.search(req.query.q);
    const dto = SearchUserResponseDto.fromEntities(users);
    res.json({ message: "success", data: dto });
  }
}
