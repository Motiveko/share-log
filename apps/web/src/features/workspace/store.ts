import type {
  WorkspaceWithMemberCount,
  WorkspaceMemberWithUser,
  UpdateMemberRoleDto,
} from "@repo/interfaces";
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
  workspacesStatus: StateStatus;
  currentWorkspaceStatus: StateStatus;
  membersStatus: StateStatus;
  lastVisitWorkspaceId: number | null;
}

interface WorkspaceActions {
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspace: (workspaceId: number) => Promise<void>;
  fetchLastVisit: () => Promise<void>;
  fetchMembers: (workspaceId: number) => Promise<void>;
  updateMemberRole: (
    workspaceId: number,
    userId: number,
    dto: UpdateMemberRoleDto
  ) => Promise<void>;
  expelMember: (workspaceId: number, userId: number) => Promise<void>;
  setCurrentWorkspace: (workspace: WorkspaceWithMemberCount | null) => void;
  reset: () => void;
}

export type WorkspaceStore = WorkspaceState & WorkspaceActions;

const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspace: null,
  members: [],
  workspacesStatus: "idle",
  currentWorkspaceStatus: "idle",
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
            state.workspacesStatus = "loading";
          });
          const workspaces = await API.workspace.list();
          set((state) => {
            state.workspaces = workspaces;
            state.workspacesStatus = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.workspacesStatus = "error";
          });
        }
      },

      fetchWorkspace: async (workspaceId: number) => {
        try {
          set((state) => {
            state.currentWorkspaceStatus = "loading";
          });
          const workspace = await API.workspace.get(workspaceId);
          set((state) => {
            state.currentWorkspace = workspace;
            state.currentWorkspaceStatus = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.currentWorkspaceStatus = "error";
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

      updateMemberRole: async (
        workspaceId: number,
        userId: number,
        dto: UpdateMemberRoleDto
      ) => {
        try {
          const updatedMember = await API.workspace.updateMemberRole(
            workspaceId,
            userId,
            dto
          );
          set((state) => {
            const index = state.members.findIndex((m) => m.userId === userId);
            if (index !== -1) {
              state.members[index] = updatedMember;
            }
          });
        } catch (error) {
          logger.error(error);
          throw error;
        }
      },

      expelMember: async (workspaceId: number, userId: number) => {
        try {
          await API.workspace.expelMember(workspaceId, userId);
          set((state) => {
            state.members = state.members.filter((m) => m.userId !== userId);
          });
        } catch (error) {
          logger.error(error);
          throw error;
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
