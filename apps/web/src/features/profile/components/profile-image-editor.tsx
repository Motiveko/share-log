import { useState, useRef, useCallback } from "react";
import { Camera } from "lucide-react";
import { Button } from "@web/components/ui/button";
import { Spinner } from "@web/components/ui/spinner";
import { AvatarCropperDialog } from "./avatar-cropper-dialog";
import { uploadFileFn } from "@web/features/file/upload";
import { toastService } from "@web/features/toast/toast-service";

interface ProfileImageEditorProps {
  currentAvatarUrl?: string;
  onUploadComplete: (avatarUrl: string) => void;
  disabled?: boolean;
}

export function ProfileImageEditor({
  currentAvatarUrl,
  onUploadComplete,
  disabled = false,
}: ProfileImageEditorProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 이미지 파일 검증
      if (!file.type.startsWith("image/")) {
        toastService.error("이미지 파일만 선택할 수 있습니다.");
        return;
      }

      // FileReader로 이미지 로드
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);

      // input 초기화 (같은 파일 다시 선택 가능하도록)
      e.target.value = "";
    },
    []
  );

  const handleCropComplete = useCallback(
    async (croppedBlob: Blob) => {
      setIsUploading(true);
      try {
        const file = new File([croppedBlob], "avatar.jpg", {
          type: "image/jpeg",
        });
        const accessUrl = await uploadFileFn(file, "avatars/profile");
        onUploadComplete(accessUrl);
        toastService.success("프로필 이미지가 변경되었습니다.");
      } catch {
        toastService.error("이미지 업로드에 실패했습니다.");
      } finally {
        setIsUploading(false);
        setImageSrc(null);
      }
    },
    [onUploadComplete]
  );

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt="프로필 이미지"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl text-muted-foreground">?</span>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Spinner className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
      >
        <Camera className="w-4 h-4 mr-2" />
        이미지 변경
      </Button>

      {imageSrc && (
        <AvatarCropperDialog
          open={isCropperOpen}
          onOpenChange={setIsCropperOpen}
          imageSrc={imageSrc}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
