import { CounterButton } from "@repo/ui";
import GoogleLoginButton from "@web/features/auth/google-login-button";

function LoginPage() {
  return (
    <div className="w-[600px] h-[400px] flex gap-5 flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl text-center font-bold">Login</h1>
      </div>
      <div className="flex flex-col items-center justify-center">
        <GoogleLoginButton />

        <CounterButton />
      </div>
    </div>
  );
}

export default LoginPage;
