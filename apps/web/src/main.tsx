import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@web/index.css";
import { ToastContainer } from "react-toastify";
import AppRoutes from "@web/app/routes";
import { preRenderSetup } from "@web/init";

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
        <ToastContainer draggable stacked />
      </BrowserRouter>
    </QueryClientProvider>
  );
} else {
  throw new Error("Could not find root element");
}
