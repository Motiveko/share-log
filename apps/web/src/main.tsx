import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@web/index.css";
import { Toaster } from "sonner";
import AppRoutes from "@web/app/routes";
import { preRenderSetup } from "@web/init";
import { ModalProvider } from "@web/features/modal";
import { DebugPanel } from "@web/features/debug";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

const el = document.getElementById("root");
if (el) {
  preRenderSetup();
  const root = createRoot(el);
  root.render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          expand={false}
          visibleToasts={5}
          gap={8}
          toastOptions={{
            unstyled: true,
          }}
        />
        <ModalProvider />
        <DebugPanel />
      </BrowserRouter>
    </QueryClientProvider>
  );
} else {
  throw new Error("Could not find root element");
}
