import { Navigate, Outlet, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@web/features/workspace/store";

type RouteStatus = "loading" | "has_workspaces" | "no_workspaces";

function WorkspaceRoute() {
  const location = useLocation();
  const { workspaces, fetchWorkspaces, fetchLastVisit, lastVisitWorkspaceId, workspacesStatus } =
    useWorkspaceStore();
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("loading");

  useEffect(() => {
    const init = async () => {
      await fetchWorkspaces();
      await fetchLastVisit();
    };
    void init();
  }, [fetchWorkspaces, fetchLastVisit]);

  useEffect(() => {
    if (workspacesStatus === "success") {
      if (workspaces.length > 0) {
        setRouteStatus("has_workspaces");
      } else {
        setRouteStatus("no_workspaces");
      }
    } else if (workspacesStatus === "error") {
      // 에러가 발생해도 워크스페이스가 없는 것으로 처리
      setRouteStatus("no_workspaces");
    }
  }, [workspacesStatus, workspaces.length]);

  // 로딩 중
  if (routeStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  // "/" 경로에서 리다이렉트 처리
  if (location.pathname === "/") {
    // 워크스페이스가 없으면 /workspace/empty로
    if (routeStatus === "no_workspaces") {
      return <Navigate to="/workspace/empty" replace />;
    }

    // 워크스페이스가 있으면 마지막 방문 또는 첫 번째 워크스페이스로
    if (routeStatus === "has_workspaces") {
      const targetWorkspaceId = lastVisitWorkspaceId ?? workspaces[0]?.id;
      if (targetWorkspaceId) {
        return <Navigate to={`/workspace/${targetWorkspaceId}`} replace />;
      }
    }
  }

  return <Outlet />;
}

export default WorkspaceRoute;
