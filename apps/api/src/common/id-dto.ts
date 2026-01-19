import { IsNotEmpty, IsNumber } from "class-validator";
import { Transform } from "class-transformer";

export class IdDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value as string), { toClassOnly: true })
  id: number;
}
