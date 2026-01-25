import { Route, Routes, useNavigate } from "react-router";
import { useEffect } from "react";
import BaseLayout from "@web/layouts/base";
import WorkspaceLayout from "@web/layouts/workspace-layout";
import NotFoundPage from "@web/pages/not-found";
import LoginPage from "@web/pages/login";
import WelcomePage from "@web/pages/welcome";
import ProfilePage from "@web/pages/profile";
import WorkspaceEmptyPage from "@web/pages/workspace-empty";
import WorkspaceNewPage from "@web/pages/workspace-new";
import WorkspaceDashboardPage from "@web/pages/workspace-dashboard";
import AdjustmentListPage from "@web/pages/adjustment-list";
import AdjustmentNewPage from "@web/pages/adjustment-new";
import AdjustmentDetailPage from "@web/pages/adjustment-detail";
import WorkspaceSettingsPage from "@web/pages/workspace-settings";
import { postRenderSetup } from "@web/init";
import ProtectedRoute from "@web/routes/protected-route";
import WorkspaceRoute from "@web/routes/workspace-route";
import Header from "@web/layouts/header";
import Footer from "@web/layouts/footer";

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const cleanup = postRenderSetup({ navigate });
    return cleanup;
  }, []);

  return (
    <Routes>
      {/* Login (no auth required) */}
      <Route element={<BaseLayout footer={<Footer />} />} path="/login">
        <Route element={<LoginPage />} index />
      </Route>

      {/* Welcome page (auth required but profile incomplete) */}
      <Route
        element={<BaseLayout footer={<Footer />} header={<Header />} />}
        path="/welcome"
      >
        <Route element={<ProtectedRoute />}>
          <Route element={<WelcomePage />} index />
        </Route>
      </Route>

      {/* Profile page (auth required) */}
      <Route
        element={<BaseLayout footer={<Footer />} header={<Header />} />}
        path="/profile"
      >
        <Route element={<ProtectedRoute />}>
          <Route element={<ProfilePage />} index />
        </Route>
      </Route>

      {/* Workspace empty page (auth required, no LNB) */}
      <Route
        element={<BaseLayout footer={<Footer />} header={<Header />} />}
        path="/workspace/empty"
      >
        <Route element={<ProtectedRoute />}>
          <Route element={<WorkspaceEmptyPage />} index />
        </Route>
      </Route>

      {/* Workspace new page (auth required, no LNB) */}
      <Route
        element={<BaseLayout footer={<Footer />} header={<Header />} />}
        path="/workspace/new"
      >
        <Route element={<ProtectedRoute />}>
          <Route element={<WorkspaceNewPage />} index />
        </Route>
      </Route>

      {/* Main workspace routes with LNB */}
      <Route
        element={<WorkspaceLayout footer={<Footer />} header={<Header />} />}
        path="/"
      >
        <Route element={<ProtectedRoute />}>
          <Route element={<WorkspaceRoute />}>
            {/* Root path - redirects based on workspace status */}
            <Route index element={null} />
            {/* Workspace dashboard */}
            <Route
              path="workspace/:workspaceId"
              element={<WorkspaceDashboardPage />}
            />
            {/* Adjustment routes */}
            <Route
              path="workspace/:workspaceId/adjustment"
              element={<AdjustmentListPage />}
            />
            <Route
              path="workspace/:workspaceId/adjustment/new"
              element={<AdjustmentNewPage />}
            />
            <Route
              path="workspace/:workspaceId/adjustment/:adjustmentId"
              element={<AdjustmentDetailPage />}
            />
            {/* Settings route */}
            <Route
              path="workspace/:workspaceId/settings"
              element={<WorkspaceSettingsPage />}
            />
          </Route>
          <Route element={<NotFoundPage />} path="*" />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
