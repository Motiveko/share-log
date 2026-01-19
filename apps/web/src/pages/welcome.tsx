import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@web/features/auth/store";
import { API } from "@web/api";
import { toast } from "react-toastify";

function WelcomePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (nickname.length < 2) {
      setError("닉네임은 최소 2자 이상이어야 합니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await API.user.patch({ nickname });
      updateUser(updatedUser);
      toast.success("닉네임이 설정되었습니다!");
      navigate("/");
    } catch (err) {
      setError("닉네임 설정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center gap-6 py-12 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">환영합니다!</h1>
        <p className="text-gray-600">
          서비스를 이용하기 전에 닉네임을 설정해주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="nickname" className="text-sm font-medium">
            닉네임
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
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || nickname.length < 2}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "설정 중..." : "시작하기"}
        </button>
      </form>
    </div>
  );
}

export default WelcomePage;
