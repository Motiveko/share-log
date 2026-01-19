import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { ValidateBody } from "@api/decorators/request-validator";
import {
  GeneratePresignedUrlRequestDto,
  InitiateMultipartUploadRequestDto,
  GeneratePartPresignedUrlsRequestDto,
  CompleteMultipartUploadRequestDto,
  AbortMultipartUploadRequestDto,
} from "@api/features/storage/dto";
import {
  StorageService,
  MultipartUploadInitResult,
  PresignedPartUrl,
} from "@api/features/storage/service";
import type {
  AuthenticatedTypedRequest,
  DataAndMessageResponse,
  TypedResponse,
} from "@api/types/express";

interface PresignedUrlResponse {
  uploadUrl: string;
  accessUrl: string;
}

interface CompleteMultipartUploadResponse {
  etag: string;
  accessUrl: string;
}

@singleton()
@Controller()
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @ValidateBody(GeneratePresignedUrlRequestDto)
  async createPresignedUrl(
    req: AuthenticatedTypedRequest<GeneratePresignedUrlRequestDto>,
    res: TypedResponse<DataAndMessageResponse<PresignedUrlResponse>>
  ) {
    const { fileName } = req.body;
    const result = await this.storageService.generatePresignedUrl(fileName);
    res.json({ message: "ok", data: result });
  }

  @ValidateBody(InitiateMultipartUploadRequestDto)
  async initiateMultipartUpload(
    req: AuthenticatedTypedRequest<InitiateMultipartUploadRequestDto>,
    res: TypedResponse<DataAndMessageResponse<MultipartUploadInitResult>>
  ) {
    const { fileName } = req.body;
    const result = await this.storageService.initiateMultipartUpload(fileName);
    res.json({ message: "ok", data: result });
  }

  @ValidateBody(GeneratePartPresignedUrlsRequestDto)
  async generatePartPresignedUrls(
    req: AuthenticatedTypedRequest<GeneratePartPresignedUrlsRequestDto>,
    res: TypedResponse<DataAndMessageResponse<PresignedPartUrl[]>>
  ) {
    const { objectName, uploadId, partNumbers, expirySeconds } = req.body;
    const result = await this.storageService.generatePresignedUrlsForParts(
      objectName,
      uploadId,
      partNumbers,
      expirySeconds
    );
    res.json({ message: "ok", data: result });
  }

  @ValidateBody(CompleteMultipartUploadRequestDto)
  async completeMultipartUpload(
    req: AuthenticatedTypedRequest<CompleteMultipartUploadRequestDto>,
    res: TypedResponse<DataAndMessageResponse<CompleteMultipartUploadResponse>>
  ) {
    const { objectName, uploadId, parts } = req.body;
    const result = await this.storageService.completeMultipartUpload(
      objectName,
      uploadId,
      parts
    );
    res.json({ message: "ok", data: result });
  }

  @ValidateBody(AbortMultipartUploadRequestDto)
  async abortMultipartUpload(
    req: AuthenticatedTypedRequest<AbortMultipartUploadRequestDto>,
    res: TypedResponse<DataAndMessageResponse<null>>
  ) {
    const { objectName, uploadId } = req.body;
    await this.storageService.abortMultipartUpload(objectName, uploadId);
    res.json({ message: "ok", data: null });
  }
}
