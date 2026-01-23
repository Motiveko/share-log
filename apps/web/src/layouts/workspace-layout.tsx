import type { ReactNode } from "react";
import { Outlet } from "react-router";
import Lnb from "@web/layouts/lnb";
import { useThemeStore } from "@web/features/theme/store";

interface WorkspaceLayoutProps {
  header?: ReactNode;
  footer?: ReactNode;
}

function WorkspaceLayout({ header, footer }: WorkspaceLayoutProps) {
  useThemeStore();

  return (
    <div className="w-[100vw] h-[100vh] flex flex-col">
      {header}
      <div className="flex-1 flex overflow-hidden">
        <Lnb />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      {footer}
    </div>
  );
}

export default WorkspaceLayout;
