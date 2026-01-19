import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import type { FileUploadState } from "@web/hooks/use-minio";
import { useMinio } from "@web/hooks/use-minio";

function FileStatusIcon({ status }: { status: FileUploadState["status"] }) {
  if (status === "uploading") {
    return (
      <svg
        className="w-4 h-4 animate-spin text-primary"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (status === "success") {
    return (
      <svg
        className="w-4 h-4 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M5 13l4 4L19 7"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      </svg>
    );
  }
  if (status === "error") {
    return (
      <svg
        className="w-4 h-4 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M6 18L18 6M6 6l12 12"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      </svg>
    );
  }
  return (
    <svg
      className="w-4 h-4 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
    </svg>
  );
}

export function FileContainer() {
  const {
    fileStates,
    isLoading,
    hasError,
    isAllSuccess,
    accessUrls,
    totalProgress,
    upload,
    reset,
  } = useMinio();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    upload(files);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && inputRef.current) {
      const dataTransfer = new DataTransfer();
      Array.from(files).forEach((file) => dataTransfer.items.add(file));
      inputRef.current.files = dataTransfer.files;
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const handleReset = () => {
    reset();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-md">
      <label
        className={`
          flex flex-col items-center justify-center
          w-full min-h-48 
          border-2 border-dashed rounded-xl
          cursor-pointer
          transition-all duration-200 ease-in-out
          ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
          }
        `}
        htmlFor="file"
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-3 p-6 w-full">
          <div
            className={`
              p-4 rounded-full transition-colors duration-200
              ${isDragging ? "bg-primary/10" : "bg-muted"}
            `}
          >
            <svg
              className={`w-8 h-8 transition-colors duration-200 ${
                isDragging ? "text-primary" : "text-muted-foreground"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
              />
            </svg>
          </div>

          {fileStates.length === 0 ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-medium text-foreground">
                Drop your files here
              </span>
              <span className="text-xs text-muted-foreground">
                or click to browse (multiple files supported)
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="text-sm font-medium text-foreground">
                {fileStates.length} file(s) selected
              </div>

              {/* 파일 목록 */}
              <div className="w-full max-h-40 overflow-y-auto space-y-1">
                {fileStates.map((state, index) => (
                  <div
                    className="flex flex-col gap-1.5 px-3 py-2 bg-muted/50 rounded-md text-xs"
                    key={index}
                  >
                    <div className="flex items-center gap-2">
                      <FileStatusIcon status={state.status} />
                      <span className="truncate flex-1 font-medium">
                        {state.file.name}
                      </span>
                      {state.accessUrl && (
                        <a
                          className="text-primary hover:underline ml-auto"
                          href={state.accessUrl}
                          onClick={(e) => { e.stopPropagation(); }}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          View
                        </a>
                      )}
                    </div>

                    {state.status === "uploading" && (
                      <div className="flex items-center gap-2 pl-6">
                        <div className="flex-1 h-1.5 bg-background/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${state.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">
                          {state.progress}%
                        </span>
                      </div>
                    )}

                    {state.status === "error" && state.error && (
                      <div className="pl-6 text-red-500 truncate">
                        {state.error.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 상태 요약 */}
              {isLoading && (
                <div className="w-full space-y-2 mt-1">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Uploading...</span>
                    <span className="tabular-nums">{totalProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${totalProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {isAllSuccess && (
                <div className="text-sm text-green-500 font-medium">
                  All files uploaded successfully!
                </div>
              )}
              {hasError && !isLoading && (
                <div className="text-sm text-red-500">
                  Some files failed to upload
                </div>
              )}

              {/* 리셋 버튼 */}
              {!isLoading && fileStates.length > 0 && (
                <button
                  className="mt-2 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    handleReset();
                  }}
                  type="button"
                >
                  Clear & Upload New Files
                </button>
              )}
            </div>
          )}
        </div>

        <input
          className="hidden"
          id="file"
          multiple
          onChange={handleChange}
          ref={inputRef}
          type="file"
        />
      </label>
    </div>
  );
}
