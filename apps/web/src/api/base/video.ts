import { z } from "zod";
import type { DataAndMessageResponse } from "@web/api/types";
import { baseHttpClient } from "@web/api/http-client";

export enum VideoStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  READY = "ready",
  PUBLISHED = "published",
  FAILED = "failed",
  PENDING_DELETION = "pending_deletion",
}

export interface VideoResponse {
  id: number;
  title: string | null;
  description: string | null;
  originalUrl: string;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  thumbnailCandidates: string[] | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  status: VideoStatus;
  errorMessage: string | null;
  labels: string[] | null;
  createdAt: string;
  updatedAt: string;
}

const VideoResponseSchema = z.object({
  id: z.number(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  originalUrl: z.string(),
  hlsUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  thumbnailCandidates: z.array(z.string()).nullable(),
  duration: z.number().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  status: z.nativeEnum(VideoStatus),
  errorMessage: z.string().nullable(),
  labels: z.array(z.string()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const VideoListResponseSchema: z.ZodType<
  DataAndMessageResponse<VideoResponse[]>
> = z.object({
  data: z.array(VideoResponseSchema),
  message: z.string(),
});

const SingleVideoResponseSchema: z.ZodType<
  DataAndMessageResponse<VideoResponse>
> = z.object({
  data: VideoResponseSchema,
  message: z.string(),
});

const DeleteVideoResponseSchema: z.ZodType<DataAndMessageResponse<null>> =
  z.object({
    data: z.null(),
    message: z.string(),
  });

// 내 비디오 목록 조회
export const getMyVideos = async (): Promise<VideoResponse[]> => {
  const response = await baseHttpClient.get("/api/v1/video", {
    schema: VideoListResponseSchema,
  });
  return response.data;
};

// 공개 비디오 목록 조회
export const getPublishedVideos = async (): Promise<VideoResponse[]> => {
  const response = await baseHttpClient.get("/api/v1/video/published", {
    schema: VideoListResponseSchema,
  });
  return response.data;
};

// 특정 비디오 조회 (내 비디오)
export const getVideo = async (id: number): Promise<VideoResponse> => {
  const response = await baseHttpClient.get(`/api/v1/video/${id}`, {
    schema: SingleVideoResponseSchema,
  });
  return response.data;
};

// 특정 비디오 조회 (공개)
export const getPublishedVideo = async (id: number): Promise<VideoResponse> => {
  const response = await baseHttpClient.get(`/api/v1/video/published/${id}`, {
    schema: SingleVideoResponseSchema,
  });
  return response.data;
};

// 비디오 생성 (업로드 후)
export const createVideo = async (
  originalUrl: string
): Promise<VideoResponse> => {
  const response = await baseHttpClient.post("/api/v1/video", {
    data: { originalUrl },
    schema: SingleVideoResponseSchema,
  });
  return response.data;
};

// 메타데이터 업데이트
export interface UpdateVideoMetadataParams {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  labels?: string[];
}

export const updateVideoMetadata = async (
  id: number,
  params: UpdateVideoMetadataParams
): Promise<VideoResponse> => {
  const response = await baseHttpClient.patch(`/api/v1/video/${id}`, {
    data: params,
    schema: SingleVideoResponseSchema,
  });
  return response.data;
};

// 비디오 발행
export interface PublishVideoParams {
  title: string;
  description?: string;
  thumbnailUrl: string;
  labels?: string[];
}

export const publishVideo = async (
  id: number,
  params: PublishVideoParams
): Promise<VideoResponse> => {
  const response = await baseHttpClient.post(`/api/v1/video/${id}/publish`, {
    data: params,
    schema: SingleVideoResponseSchema,
  });
  return response.data;
};

// 비디오 삭제
export const deleteVideo = async (id: number): Promise<void> => {
  await baseHttpClient.delete(`/api/v1/video/${id}`, {
    schema: DeleteVideoResponseSchema,
  });
};
