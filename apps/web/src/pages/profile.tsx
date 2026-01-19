import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@web/features/auth/store";
import { API } from "@web/api";
import { toast } from "react-toastify";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(
    user?.slackWebhookUrl || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (nickname.length < 2) {
      newErrors.nickname = "닉네임은 최소 2자 이상이어야 합니다.";
    }

    if (avatarUrl && !isValidUrl(avatarUrl)) {
      newErrors.avatarUrl = "유효한 URL 형식이어야 합니다.";
    }

    if (slackWebhookUrl && !isValidUrl(slackWebhookUrl)) {
      newErrors.slackWebhookUrl = "유효한 URL 형식이어야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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
        avatarUrl: avatarUrl || undefined,
        slackWebhookUrl: slackWebhookUrl || undefined,
      });
      updateUser(updatedUser);
      toast.success("프로필이 수정되었습니다!");
    } catch (err) {
      toast.error("프로필 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await API.user.deleteAccount();
      toast.success("회원 탈퇴가 완료되었습니다.");
      await logout();
      navigate("/login");
    } catch (err) {
      toast.error("회원 탈퇴에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-8 py-8 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">프로필 설정</h1>
        <p className="text-gray-600">{user?.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="nickname" className="text-sm font-medium">
            닉네임 *
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            minLength={2}
            required
            disabled={isSubmitting}
          />
          {errors.nickname && (
            <p className="text-red-500 text-sm">{errors.nickname}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="avatarUrl" className="text-sm font-medium">
            아바타 URL
          </label>
          <input
            id="avatarUrl"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
          {errors.avatarUrl && (
            <p className="text-red-500 text-sm">{errors.avatarUrl}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="slackWebhookUrl" className="text-sm font-medium">
            Slack 웹훅 URL
          </label>
          <input
            id="slackWebhookUrl"
            type="url"
            value={slackWebhookUrl}
            onChange={(e) => setSlackWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
          {errors.slackWebhookUrl && (
            <p className="text-red-500 text-sm">{errors.slackWebhookUrl}</p>
          )}
          <p className="text-gray-500 text-xs">
            알림을 받을 Slack 채널의 웹훅 URL을 입력하세요.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "저장 중..." : "저장"}
        </button>
      </form>

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-red-600 mb-4">위험 구역</h2>
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 border border-red-600 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
          >
            회원 탈퇴
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? "탈퇴 중..." : "탈퇴 확인"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
