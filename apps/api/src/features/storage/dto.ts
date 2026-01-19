import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";

export class GeneratePresignedUrlRequestDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;
}

// Multipart Upload DTOs
export class InitiateMultipartUploadRequestDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;
}

export class GeneratePartPresignedUrlsRequestDto {
  @IsString()
  @IsNotEmpty()
  objectName: string;

  @IsString()
  @IsNotEmpty()
  uploadId: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  partNumbers: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  expirySeconds?: number;
}

export class CompleteMultipartUploadPartDto {
  @IsInt()
  @Min(1)
  partNumber: number;

  @IsString()
  @IsNotEmpty()
  etag: string;
}

export class CompleteMultipartUploadRequestDto {
  @IsString()
  @IsNotEmpty()
  objectName: string;

  @IsString()
  @IsNotEmpty()
  uploadId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompleteMultipartUploadPartDto)
  parts: CompleteMultipartUploadPartDto[];
}

export class AbortMultipartUploadRequestDto {
  @IsString()
  @IsNotEmpty()
  objectName: string;

  @IsString()
  @IsNotEmpty()
  uploadId: string;
}
