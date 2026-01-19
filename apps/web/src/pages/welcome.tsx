import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@web/features/auth/store";
import { API } from "@web/api";
import { toast } from "react-toastify";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";
import { FormField } from "@web/components/ui/form-field";
import { Button } from "@web/components/ui/button";

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
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>환영합니다!</CardTitle>
        <CardDescription>
          서비스를 이용하기 전에 닉네임을 설정해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="닉네임"
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            minLength={2}
            disabled={isSubmitting}
            error={error}
          />
          <Button
            type="submit"
            disabled={isSubmitting || nickname.length < 2}
            className="w-full"
          >
            {isSubmitting ? "설정 중..." : "시작하기"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default WelcomePage;
