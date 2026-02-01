import { enableMapSet } from "immer";
import { AxiosError } from "axios";
import type { NavigateFunction } from "react-router";
import { addToast } from "@web/features/toast/toast-service";
import { baseHttpClient } from "@web/api/http-client";
import { useAuthStore } from "@web/features/auth/store";

export const preRenderSetup = () => {
  enableMapSet();
};

interface PostRenderSetupOptions {
  navigate: NavigateFunction;
}

export const postRenderSetup = ({ navigate }: PostRenderSetupOptions) => {
  const interceptorId = baseHttpClient.addErrorResponseInterceptor(
    async (error) => {
      // TODO : http 에러를 별도 에러로 래핑하고 unauthorized() 같은건 에러객체에 구현하도록 변경
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          // 명시적 로그아웃 중에는 토스트 표시하지 않음
          if (useAuthStore.getState().isLogoutInProgress) {
            return;
          }
          await addToast({
            message: "세션이 만료되었습니다.",
            type: "error",
          });
          await navigate("/login");
        }
      }
    }
  );

  return () => {
    baseHttpClient.removeErrorResponseInterceptor(interceptorId);
  };
};
