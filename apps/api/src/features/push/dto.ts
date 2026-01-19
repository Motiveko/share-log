import {
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsOptional,
  IsNumber,
} from "class-validator";
import { plainToInstance, Type } from "class-transformer";

class PushSubscriptionKeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  auth: string;
}

export class SubscribePushRequestDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys: PushSubscriptionKeysDto;
}

export class UnsubscribePushRequestDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;
}

export class SendTestPushRequestDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  body?: string;
}

export class SendTestPushResponseDto {
  @IsNumber()
  @IsNotEmpty()
  sentCount: number;

  @IsNumber()
  @IsNotEmpty()
  failCount: number;

  static fromPlainObject(object: { sentCount: number; failCount: number }) {
    return plainToInstance(SendTestPushResponseDto, object);
  }
}
