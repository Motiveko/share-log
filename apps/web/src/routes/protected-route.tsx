import { Navigate, Outlet } from "react-router";
import { useEffect } from "react";
import { useAuthStore } from "@web/features/auth/store";

function ProtectedRoute() {
  const { user, status, init } = useAuthStore();
  console.log('user', user)

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

  return <Outlet />;
}

export default ProtectedRoute;
