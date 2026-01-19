import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { ValidateBody } from "@api/decorators/request-validator";
import {
  SubscribePushRequestDto,
  UnsubscribePushRequestDto,
  SendTestPushRequestDto,
  SendTestPushResponseDto,
} from "@api/features/push/dto";
import { PushService } from "@api/features/push/service";
import type {
  AuthenticatedTypedRequest,
  DataAndMessageResponse,
  MessageResponse,
  TypedRequest,
  TypedResponse,
} from "@api/types/express";

interface VapidPublicKeyResponse {
  publicKey: string;
}

@singleton()
@Controller()
export class PushController {
  constructor(private readonly pushService: PushService) {}

  getVapidPublicKey(
    _req: TypedRequest,
    res: TypedResponse<DataAndMessageResponse<VapidPublicKeyResponse>>
  ) {
    const publicKey = this.pushService.getPublicKey();
    res.json({ message: "ok", data: { publicKey } });
  }

  @ValidateBody(SubscribePushRequestDto)
  async subscribe(
    req: AuthenticatedTypedRequest<SubscribePushRequestDto>,
    res: TypedResponse
  ) {
    const { endpoint, keys } = req.body;
    await this.pushService.subscribe(
      req.user.id,
      endpoint,
      keys.p256dh,
      keys.auth
    );
    res.json({ message: "ok" });
  }

  @ValidateBody(UnsubscribePushRequestDto)
  async unsubscribe(
    req: AuthenticatedTypedRequest<UnsubscribePushRequestDto>,
    res: TypedResponse
  ) {
    const { endpoint } = req.body;
    await this.pushService.unsubscribe(endpoint);
    res.json({ message: "ok" });
  }

  @ValidateBody(SendTestPushRequestDto)
  async sendTest(
    req: AuthenticatedTypedRequest<SendTestPushRequestDto>,
    res: TypedResponse<DataAndMessageResponse<SendTestPushResponseDto>>
  ) {
    const {
      title = "Test Notification",
      body = "This is a test push notification!",
    } = req.body;

    const result = await this.pushService.sendToUser(req.user.id, {
      title,
      body,
      icon: "/favicon.ico",
    });
    res.json({ message: "ok", data: result });
  }
}
