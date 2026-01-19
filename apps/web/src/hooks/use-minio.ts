import { useCallback, useMemo, useState } from "react";
import { SIZE } from "@repo/constants";
import { uploadFileFn, uploadFileMultipartFn } from "@web/features/file/upload";

const DEFAULT_MULTIPART_THRESHOLD = 5 * SIZE.MB;

const DEFAULT_PART_SIZE = 5 * SIZE.MB;

export interface FileUploadState {
  id: number;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  accessUrl: string | null;
  error: Error | null;
  progress?: number; // 0-100, multipart upload 진행률
}

export interface UseMinioOptions {
  /** 이 값보다 큰 파일은 multipart upload를 사용합니다. (기본값: 5MB) */
  multipartThreshold?: number;
  /** multipart upload 시 각 part의 크기입니다. (기본값: 5MB) */
  partSize?: number;
}

export function useMinio(options: UseMinioOptions = {}) {
  const {
    multipartThreshold = DEFAULT_MULTIPART_THRESHOLD,
    partSize = DEFAULT_PART_SIZE,
  } = options;

  const [fileStates, setFileStates] = useState<FileUploadState[]>([]);

  const updateFileState = useCallback(
    (id: number, updates: Partial<FileUploadState>) => {
      setFileStates((prev) =>
        prev.map((state) =>
          state.id === id ? { ...state, ...updates } : state
        )
      );
    },
    []
  );

  const uploadSingleFile = useCallback(
    async (file: File, id: number) => {
      updateFileState(id, { status: "uploading", progress: 0 });
      try {
        let accessUrl: string;

        if (file.size > multipartThreshold) {
          // 대용량 파일: multipart upload
          accessUrl = await uploadFileMultipartFn(file, partSize, (progress) =>
            { updateFileState(id, { progress }); }
          );
        } else {
          // 소용량 파일: 일반 업로드
          accessUrl = await uploadFileFn(file);
          updateFileState(id, { progress: 100 });
        }

        updateFileState(id, { status: "success", accessUrl, progress: 100 });
        return accessUrl;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        updateFileState(id, { status: "error", error });
        return null;
      }
    },
    [updateFileState, multipartThreshold, partSize]
  );

  const upload = useCallback(
    async (files: File[]) => {
      // 명시적으로 reset을 하지 않으면 기존 상태를 유지하고 새로운 파일을 추가한다.

      // 초기 상태 설정
      const initialStates: FileUploadState[] = files.map((file) => ({
        id: Date.now() + Math.random(), // 상태 관리를 위한 id
        file,
        status: "pending",
        accessUrl: null,
        error: null,
        progress: 0,
      }));
      setFileStates((prev) => [...prev, ...initialStates]);

      // 병렬로 파일 업로드
      await Promise.all(
        initialStates.map((state) => uploadSingleFile(state.file, state.id))
      );
    },
    [uploadSingleFile]
  );

  const reset = useCallback(() => {
    setFileStates([]);
  }, []);

  // 편의를 위한 computed values
  const isLoading = fileStates.some((state) => state.status === "uploading");
  const hasError = fileStates.some((state) => state.status === "error");
  const isAllSuccess =
    fileStates.length > 0 &&
    fileStates.every((state) => state.status === "success");
  const accessUrls = fileStates
    .filter((state) => state.accessUrl !== null)
    .map((state) => state.accessUrl!);

  // 전체 진행률 (모든 파일의 평균)
  const totalProgress = useMemo(() => {
    if (fileStates.length === 0) return 0;
    const sum = fileStates.reduce(
      (acc, state) => acc + (state.progress || 0),
      0
    );
    return Math.round(sum / fileStates.length);
  }, [fileStates]);

  return {
    fileStates,
    isLoading,
    hasError,
    isAllSuccess,
    accessUrls,
    totalProgress,
    upload,
    reset,
  };
}
