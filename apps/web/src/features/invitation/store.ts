import type { InvitationWithWorkspace } from "@repo/interfaces";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { API } from "@web/api";
import { logger } from "@web/lib/logger";

type StateStatus = "idle" | "loading" | "success" | "error";

interface InvitationState {
  invitations: InvitationWithWorkspace[];
  status: StateStatus;
}

interface InvitationActions {
  fetchInvitations: () => Promise<void>;
  acceptInvitation: (id: number) => Promise<void>;
  rejectInvitation: (id: number) => Promise<void>;
  reset: () => void;
}

export type InvitationStore = InvitationState & InvitationActions;

const initialState: InvitationState = {
  invitations: [],
  status: "idle",
};

export const useInvitationStore = create<InvitationStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      fetchInvitations: async () => {
        try {
          set((state) => {
            state.status = "loading";
          });
          const invitations = await API.invitation.listMyInvitations();
          set((state) => {
            state.invitations = invitations;
            state.status = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.status = "error";
          });
        }
      },

      acceptInvitation: async (id: number) => {
        try {
          await API.invitation.accept(id);
          set((state) => {
            state.invitations = state.invitations.filter((inv) => inv.id !== id);
          });
        } catch (error) {
          logger.error(error);
          throw error;
        }
      },

      rejectInvitation: async (id: number) => {
        try {
          await API.invitation.reject(id);
          set((state) => {
            state.invitations = state.invitations.filter((inv) => inv.id !== id);
          });
        } catch (error) {
          logger.error(error);
          throw error;
        }
      },

      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },
    })),
    { name: "invitation" }
  )
);
