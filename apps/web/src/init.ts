import { enableMapSet } from "immer";
import { AxiosError } from "axios";
import type { NavigateFunction } from "react-router";
import { addToast } from "@web/features/toast/toast-service";
import { baseHttpClient } from "@web/api/http-client";

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
          await addToast({
            message: "Unauthorized",
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
