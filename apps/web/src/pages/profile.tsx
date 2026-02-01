import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@web/features/auth/store";
import { API } from "@web/api";
import { toastService } from "@web/features/toast/toast-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";
import { FormField } from "@web/components/ui/form-field";
import { Button } from "@web/components/ui/button";
import { ProfileImageEditor } from "@web/features/profile/components/profile-image-editor";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(
    user?.slackWebhookUrl || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (nickname.length < 2) {
      newErrors.nickname = "닉네임은 최소 2자 이상이어야 합니다.";
    }

    if (slackWebhookUrl && !isValidUrl(slackWebhookUrl)) {
      newErrors.slackWebhookUrl = "유효한 URL 형식이어야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await API.user.patch({
        nickname,
        slackWebhookUrl: slackWebhookUrl || undefined,
      });
      updateUser(updatedUser);
      toastService.success("프로필이 수정되었습니다!");
    } catch (err) {
      toastService.error("프로필 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async (avatarUrl: string) => {
    try {
      const updatedUser = await API.user.patch({ avatarUrl });
      updateUser(updatedUser);
    } catch {
      toastService.error("프로필 이미지 저장에 실패했습니다.");
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await API.user.deleteAccount();
      toastService.success("회원 탈퇴가 완료되었습니다.");
      await logout();
      navigate("/login");
    } catch (err) {
      toastService.error("회원 탈퇴에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-6 py-8 px-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>프로필 설정</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium">프로필 이미지</span>
              <ProfileImageEditor
                currentAvatarUrl={user?.avatarUrl}
                onUploadComplete={handleAvatarUpload}
                disabled={isSubmitting}
              />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FormField
                label="닉네임"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                minLength={2}
                disabled={isSubmitting}
                error={errors.nickname}
              />
              <FormField
                label="Slack 웹훅 URL"
                type="url"
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                disabled={isSubmitting}
                error={errors.slackWebhookUrl}
                hint="알림을 받을 Slack 채널의 웹훅 URL을 입력하세요."
              />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">위험 구역</CardTitle>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full border-destructive text-destructive hover:bg-destructive/10"
            >
              회원 탈퇴
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? "탈퇴 중..." : "탈퇴 확인"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfilePage;
