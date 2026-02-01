import { useEffect } from "react";
import { useNavigate } from "react-router";
import GoogleLoginButton from "@web/features/auth/google-login-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";
import { useAuthStore } from "@web/features/auth/store";

function LoginPage() {
  const { user, status, init } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "idle") {
      void init();
    }
  }, [init, status]);

  useEffect(() => {
    if (status === "success" && user) {
      navigate("/", { replace: true });
    }
  }, [status, user, navigate]);

  if (status === "loading" || (status === "success" && user)) {
    return null;
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>로그인</CardTitle>
        <CardDescription>계정에 로그인하세요</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <GoogleLoginButton />
      </CardContent>
    </Card>
  );
}

export default LoginPage;
