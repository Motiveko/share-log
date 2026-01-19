import { z } from "zod";
import type { DataAndMessageResponse } from "@web/api/types";
import { baseHttpClient } from "@web/api/http-client";

export interface PresignedUrlResponse {
  uploadUrl: string;
  accessUrl: string;
}

export interface MultipartUploadInitResponse {
  uploadId: string;
  objectName: string;
  bucketName: string;
  accessUrl: string;
}

export interface PresignedPartUrl {
  partNumber: number;
  uploadUrl: string;
}

export interface CompleteMultipartUploadResponse {
  etag: string;
  accessUrl: string;
}

export interface FilePart {
  partNumber: number;
  etag: string;
}

const GeneratePresignedUrlResponseSchema: z.ZodType<
  DataAndMessageResponse<PresignedUrlResponse>
> = z.object({
  data: z.object({
    uploadUrl: z.string(),
    accessUrl: z.string(),
  }),
  message: z.string(),
});

const InitiateMultipartUploadResponseSchema: z.ZodType<
  DataAndMessageResponse<MultipartUploadInitResponse>
> = z.object({
  data: z.object({
    uploadId: z.string(),
    objectName: z.string(),
    bucketName: z.string(),
    accessUrl: z.string(),
  }),
  message: z.string(),
});

const GeneratePartPresignedUrlsResponseSchema: z.ZodType<
  DataAndMessageResponse<PresignedPartUrl[]>
> = z.object({
  data: z.array(
    z.object({
      partNumber: z.number(),
      uploadUrl: z.string(),
    })
  ),
  message: z.string(),
});

const CompleteMultipartUploadResponseSchema: z.ZodType<
  DataAndMessageResponse<CompleteMultipartUploadResponse>
> = z.object({
  data: z.object({
    etag: z.string(),
    accessUrl: z.string(),
  }),
  message: z.string(),
});

const AbortMultipartUploadResponseSchema: z.ZodType<
  DataAndMessageResponse<null>
> = z.object({
  data: z.null(),
  message: z.string(),
});

export const generatePresignedUrl = async (
  fileName: string,
  contentType?: string
): Promise<PresignedUrlResponse> => {
  const response = await baseHttpClient.post("/api/v1/storage/presigned-url", {
    data: { fileName },
    schema: GeneratePresignedUrlResponseSchema,
  });
  return response.data;
};

export const uploadFile = async (presignedUrl: string, file: File) => {
  const response = await baseHttpClient.put(presignedUrl, {
    data: file,
    headers: {
      "Content-Type": file.type,
    },
    schema: z.any(),
  });

  return response;
};

// Multipart Upload API

export const initiateMultipartUpload = async (
  fileName: string
): Promise<MultipartUploadInitResponse> => {
  const response = await baseHttpClient.post(
    "/api/v1/storage/multipart/initiate",
    {
      data: { fileName },
      schema: InitiateMultipartUploadResponseSchema,
    }
  );
  return response.data;
};

export const generatePartPresignedUrls = async (
  objectName: string,
  uploadId: string,
  partNumbers: number[],
  expirySeconds?: number
): Promise<PresignedPartUrl[]> => {
  const response = await baseHttpClient.post(
    "/api/v1/storage/multipart/presigned-urls",
    {
      data: { objectName, uploadId, partNumbers, expirySeconds },
      schema: GeneratePartPresignedUrlsResponseSchema,
    }
  );
  return response.data;
};

export const completeMultipartUpload = async (
  objectName: string,
  uploadId: string,
  parts: FilePart[]
): Promise<CompleteMultipartUploadResponse> => {
  const response = await baseHttpClient.post(
    "/api/v1/storage/multipart/complete",
    {
      data: { objectName, uploadId, parts },
      schema: CompleteMultipartUploadResponseSchema,
    }
  );
  return response.data;
};

export const abortMultipartUpload = async (
  objectName: string,
  uploadId: string
): Promise<void> => {
  await baseHttpClient.post("/api/v1/storage/multipart/abort", {
    data: { objectName, uploadId },
    schema: AbortMultipartUploadResponseSchema,
  });
};
