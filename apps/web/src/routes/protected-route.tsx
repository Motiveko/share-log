import { Navigate, Outlet, useLocation } from "react-router";
import { useEffect } from "react";
import { useAuthStore } from "@web/features/auth/store";

function ProtectedRoute() {
  const { user, status, init } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (status === "idle") {
      void init();
    }
  }, [init, status]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "success" && !user) {
    return <Navigate to="/login" />;
  }

  // 프로필 미완료 시 /welcome 페이지로 리다이렉트 (단, 이미 /welcome에 있으면 제외)
  if (user && !user.isProfileComplete && location.pathname !== "/welcome") {
    return <Navigate to="/welcome" />;
  }

  // 프로필 완료 후 /welcome 접근 시 홈으로 리다이렉트
  if (user && user.isProfileComplete && location.pathname === "/welcome") {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
