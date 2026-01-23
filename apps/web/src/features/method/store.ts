import type { LogMethod, CreateMethodDto, UpdateMethodDto } from "@repo/interfaces";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { API } from "@web/api";
import { logger } from "@web/lib/logger";

type StateStatus = "idle" | "loading" | "success" | "error";

interface MethodState {
  methods: LogMethod[];
  status: StateStatus;
}

interface MethodActions {
  fetchMethods: (workspaceId: number) => Promise<void>;
  createMethod: (workspaceId: number, dto: CreateMethodDto) => Promise<LogMethod>;
  updateMethod: (workspaceId: number, methodId: number, dto: UpdateMethodDto) => Promise<LogMethod>;
  deleteMethod: (workspaceId: number, methodId: number) => Promise<void>;
  reset: () => void;
}

export type MethodStore = MethodState & MethodActions;

const initialState: MethodState = {
  methods: [],
  status: "idle",
};

export const useMethodStore = create<MethodStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      fetchMethods: async (workspaceId: number) => {
        try {
          set((state) => {
            state.status = "loading";
          });
          const methods = await API.method.list(workspaceId);
          set((state) => {
            state.methods = methods;
            state.status = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.status = "error";
          });
        }
      },

      createMethod: async (workspaceId: number, dto: CreateMethodDto) => {
        const method = await API.method.create(workspaceId, dto);
        set((state) => {
          state.methods.push(method);
        });
        return method;
      },

      updateMethod: async (
        workspaceId: number,
        methodId: number,
        dto: UpdateMethodDto
      ) => {
        const method = await API.method.update(workspaceId, methodId, dto);
        set((state) => {
          const index = state.methods.findIndex((m) => m.id === methodId);
          if (index !== -1) {
            state.methods[index] = method;
          }
        });
        return method;
      },

      deleteMethod: async (workspaceId: number, methodId: number) => {
        await API.method.remove(workspaceId, methodId);
        set((state) => {
          state.methods = state.methods.filter((m) => m.id !== methodId);
        });
      },

      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },
    })),
    { name: "method" }
  )
);
