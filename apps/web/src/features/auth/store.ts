import type { User } from "@repo/interfaces";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { API } from "@web/api";
import { logger } from "@web/lib/logger";

type StateStatus = "idle" | "loading" | "success";

interface AuthState {
  user: User | null;
  status: StateStatus;
}

interface AuthActions {
  updateStatus: (status: StateStatus) => void;
  updateUser: (user: User) => void;
  init: () => Promise<void>;
  logout: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    immer((set, get) => ({
      user: null,
      status: "idle",

      updateStatus: (status: StateStatus) => {
        set((state) => {
          state.status = status;
        });
      },

      updateUser: (user: User) => {
        set((state) => {
          state.user = user;
        });
      },

      init: async () => {
        try {
          get().updateStatus("loading");
          const user = await API.user.get();
          get().updateUser(user);
        } catch (error) {
          logger.error(error);
        } finally {
          get().updateStatus("success");
        }
      },

      logout: async () => {
        get().updateStatus("loading");
        try {
          await API.user.logout();
          get().updateStatus("success");
        } catch (error) {
          logger.error(error);
        } finally {
          get().updateStatus("idle");
        }
      },
    })),
    { name: "auth" }
  )
);
