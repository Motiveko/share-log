import type { FilePart } from "@web/api/base/storage";
import {
  abortMultipartUpload,
  completeMultipartUpload,
  generatePartPresignedUrls,
  generatePresignedUrl,
  initiateMultipartUpload,
  uploadFile,
} from "@web/api/base/storage";
import { minioHttpClient } from "@web/api/http-client";

/** 일반 단일 파일 업로드 */
export const uploadFileFn = async (
  file: File,
  /** 커스텀 오브젝트 경로 (지정하지 않으면 file.name 사용) */
  objectName?: string
): Promise<string> => {
  const { uploadUrl, accessUrl } = await generatePresignedUrl(
    objectName ?? file.name,
    file.type
  );
  await uploadFile(uploadUrl, file);
  return accessUrl;
};

/** Multipart 파일 업로드 */
export const uploadFileMultipartFn = async (
  file: File,
  partSize: number,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // 1. Multipart upload 시작
  const { uploadId, objectName, accessUrl } = await initiateMultipartUpload(
    file.name
  );

  try {
    // 2. 파일을 part로 분할
    const totalParts = Math.ceil(file.size / partSize);
    const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);

    // 3. 각 part에 대한 presigned URL 생성
    const presignedUrls = await generatePartPresignedUrls(
      objectName,
      uploadId,
      partNumbers
    );

    // 4. 각 part 업로드 및 etag 수집
    const uploadedParts: FilePart[] = [];
    let completedParts = 0;

    for (const { partNumber, uploadUrl } of presignedUrls) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const partBlob = file.slice(start, end);

      const { headers } = await minioHttpClient.put(uploadUrl, {
        data: partBlob,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        withHeaders: true,
      });

      // ETag 헤더에서 etag 추출 (큰따옴표 제거)
      const etag = headers.etag?.replace(/"/g, "") || "";
      uploadedParts.push({ partNumber, etag });

      completedParts++;
      onProgress?.(Math.round((completedParts / totalParts) * 100));
    }

    // 5. Multipart upload 완료
    await completeMultipartUpload(objectName, uploadId, uploadedParts);

    return accessUrl;
  } catch (error) {
    // 실패 시 multipart upload 중단
    await abortMultipartUpload(objectName, uploadId).catch(() => {
      // TODO : abort 실패는 무시
    });
    throw error;
  }
};
