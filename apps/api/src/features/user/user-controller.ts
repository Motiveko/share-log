import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { UserResponseDto } from "@api/features/user/dto";
import type {
  DataAndMessageResponse,
  AuthenticatedTypedRequest,
  TypedResponse,
} from "@api/types/express";

@singleton()
@Controller()
export class UserController {
  get(
    req: AuthenticatedTypedRequest,
    res: TypedResponse<DataAndMessageResponse<UserResponseDto>>
  ) {
    res.json({ message: "success", data: req.user });
  }
}
