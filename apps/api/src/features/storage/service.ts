import { singleton } from "tsyringe";
import { Config } from "@api/config/env";
import { toNumber } from "lodash";
import * as Minio from "minio";

export interface MultipartUploadInitResult {
  uploadId: string;
  objectName: string;
  bucketName: string;
  accessUrl: string;
}

export interface PresignedPartUrl {
  partNumber: number;
  uploadUrl: string;
}

export interface CompleteMultipartUploadPart {
  partNumber: number;
  etag: string;
}

@singleton()
export class StorageService {
  private readonly minioClient: Minio.Client;

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: Config.MINIO_HOST,
      port: toNumber(Config.MINIO_PORT),
      useSSL: Config.MINIO_USE_SSL,
      accessKey: Config.MINIO_ACCESS_KEY,
      secretKey: Config.MINIO_SECRET_KEY,
    });
  }

  async generatePresignedUrl(fileName: string) {
    const bucketName = Config.MINIO_BUCKET_NAME;
    const objectName = this.withTimestamp(fileName);
    const uploadUrl = await this.minioClient.presignedPutObject(
      bucketName,
      objectName
    );
    const accessUrl = this.getPublicUrl(bucketName, objectName);
    return { uploadUrl, accessUrl };
  }

  /**
   * Multipart upload 시작 - uploadId를 발급받습니다.
   */
  async initiateMultipartUpload(
    fileName: string
  ): Promise<MultipartUploadInitResult> {
    const bucketName = Config.MINIO_BUCKET_NAME;
    const objectName = this.withTimestamp(fileName);

    const uploadId = await this.minioClient.initiateNewMultipartUpload(
      bucketName,
      objectName,
      {}
    );

    const accessUrl = this.getPublicUrl(bucketName, objectName);
    return { uploadId, objectName, bucketName, accessUrl };
  }

  /**
   * 각 part에 대한 presigned URL을 생성합니다.
   * @param objectName - 업로드할 객체 이름 (initiateMultipartUpload에서 받은 값)
   * @param uploadId - initiateMultipartUpload에서 받은 uploadId
   * @param partNumbers - 업로드할 part 번호들 (1부터 시작)
   * @param expirySeconds - presigned URL 만료 시간 (기본 1시간)
   */
  async generatePresignedUrlsForParts(
    objectName: string,
    uploadId: string,
    partNumbers: number[],
    expirySeconds = 3600
  ): Promise<PresignedPartUrl[]> {
    const bucketName = Config.MINIO_BUCKET_NAME;

    const presignedUrls = await Promise.all(
      partNumbers.map(async (partNumber) => {
        const uploadUrl = await this.minioClient.presignedUrl(
          "PUT",
          bucketName,
          objectName,
          expirySeconds,
          {
            uploadId,
            partNumber: String(partNumber),
          }
        );
        return { partNumber, uploadUrl };
      })
    );

    return presignedUrls;
  }

  /**
   * Multipart upload를 완료합니다.
   * 클라이언트에서 모든 part를 업로드한 후 호출해야 합니다.
   * @param objectName - 업로드할 객체 이름
   * @param uploadId - initiateMultipartUpload에서 받은 uploadId
   * @param parts - 업로드 완료된 part 정보 (partNumber, etag)
   */
  async completeMultipartUpload(
    objectName: string,
    uploadId: string,
    parts: CompleteMultipartUploadPart[]
  ): Promise<{ etag: string; accessUrl: string }> {
    const bucketName = Config.MINIO_BUCKET_NAME;

    // parts를 partNumber 순으로 정렬
    const sortedParts = parts
      .sort((a, b) => a.partNumber - b.partNumber)
      .map((part) => ({
        part: part.partNumber,
        etag: part.etag,
      }));

    const result = await this.minioClient.completeMultipartUpload(
      bucketName,
      objectName,
      uploadId,
      sortedParts
    );

    const accessUrl = this.getPublicUrl(bucketName, objectName);
    return { etag: result.etag, accessUrl };
  }

  /**
   * Multipart upload를 취소합니다.
   */
  async abortMultipartUpload(
    objectName: string,
    uploadId: string
  ): Promise<void> {
    const bucketName = Config.MINIO_BUCKET_NAME;
    await this.minioClient.abortMultipartUpload(
      bucketName,
      objectName,
      uploadId
    );
  }

  private getPublicUrl(bucketName: string, objectName: string) {
    const protocol = Config.MINIO_USE_SSL ? "https" : "http";
    return `${protocol}://${Config.MINIO_HOST}:${Config.MINIO_PORT}/${bucketName}/${objectName}`;
  }

  private withTimestamp(fileName: string) {
    return `${fileName}-${Date.now()}`;
  }
}
