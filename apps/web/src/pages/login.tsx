import GoogleLoginButton from "@web/features/auth/google-login-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";

function LoginPage() {
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
