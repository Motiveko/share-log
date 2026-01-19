import { useThemeStore } from "@web/features/theme/store";
import type { ReactNode } from "react";
import { Outlet } from "react-router";

interface BaseLayoutProps {
  header?: ReactNode;
  footer?: ReactNode;
}

function BaseLayout({ header, footer }: BaseLayoutProps) {
  useThemeStore();

  return (
    <div className="w-[100vw] h-[100vh] flex flex-col">
      {header}
      <main className="flex-1 flex justify-center items-center">
        <Outlet />
      </main>
      {footer}
    </div>
  );
}

export default BaseLayout;
