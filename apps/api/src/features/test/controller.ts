import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { ValidateBody } from "@api/decorators/request-validator";
import { LoginDto, UserResponseDto } from "@api/features/user/dto";
import { IdDto } from "@api/common/id-dto";
import { UserService } from "@api/features/user/service";
import type {
  AuthenticatedRequest,
  DataAndMessageResponse,
  TypedRequest,
  TypedResponse,
} from "@api/types/express";

@singleton()
@Controller()
export class TestController {
  constructor(private readonly userService: UserService) {}

  @ValidateBody(LoginDto)
  async login(
    req: TypedRequest<LoginDto>,
    res: TypedResponse<DataAndMessageResponse<UserResponseDto>>
  ) {
    const user = await this.userService.create(req.body);
    const userDto = UserResponseDto.fromEntity(user);
    req.logIn(userDto, (err) => {
      if (err) {
        throw new Error("로그인 실패");
      }
      res.json({ message: "ok", data: userDto });
    });
  }

  @ValidateBody(IdDto)
  async logout(req: AuthenticatedRequest<IdDto>, res: TypedResponse) {
    await this.userService.deleteById(req.user.id);
    req.logout(() => {
      res.json({ message: "ok" });
    });
  }
}
