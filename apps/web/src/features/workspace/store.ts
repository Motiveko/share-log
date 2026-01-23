import type { WorkspaceWithMemberCount, WorkspaceMemberWithUser } from "@repo/interfaces";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { API } from "@web/api";
import { logger } from "@web/lib/logger";

type StateStatus = "idle" | "loading" | "success" | "error";

interface WorkspaceState {
  workspaces: WorkspaceWithMemberCount[];
  currentWorkspace: WorkspaceWithMemberCount | null;
  members: WorkspaceMemberWithUser[];
  status: StateStatus;
  membersStatus: StateStatus;
  lastVisitWorkspaceId: number | null;
}

interface WorkspaceActions {
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspace: (workspaceId: number) => Promise<void>;
  fetchLastVisit: () => Promise<void>;
  fetchMembers: (workspaceId: number) => Promise<void>;
  setCurrentWorkspace: (workspace: WorkspaceWithMemberCount | null) => void;
  reset: () => void;
}

export type WorkspaceStore = WorkspaceState & WorkspaceActions;

const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspace: null,
  members: [],
  status: "idle",
  membersStatus: "idle",
  lastVisitWorkspaceId: null,
};

export const useWorkspaceStore = create<WorkspaceStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      fetchWorkspaces: async () => {
        try {
          set((state) => {
            state.status = "loading";
          });
          const workspaces = await API.workspace.list();
          set((state) => {
            state.workspaces = workspaces;
            state.status = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.status = "error";
          });
        }
      },

      fetchWorkspace: async (workspaceId: number) => {
        try {
          set((state) => {
            state.status = "loading";
          });
          const workspace = await API.workspace.get(workspaceId);
          set((state) => {
            state.currentWorkspace = workspace;
            state.status = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.status = "error";
          });
        }
      },

      fetchLastVisit: async () => {
        try {
          const data = await API.workspace.getLastVisit();
          set((state) => {
            state.lastVisitWorkspaceId = data.workspaceId;
          });
        } catch (error) {
          logger.error(error);
        }
      },

      fetchMembers: async (workspaceId: number) => {
        try {
          set((state) => {
            state.membersStatus = "loading";
          });
          const members = await API.workspace.getMembers(workspaceId);
          set((state) => {
            state.members = members;
            state.membersStatus = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.membersStatus = "error";
          });
        }
      },

      setCurrentWorkspace: (workspace: WorkspaceWithMemberCount | null) => {
        set((state) => {
          state.currentWorkspace = workspace;
        });
      },

      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },
    })),
    { name: "workspace" }
  )
);
