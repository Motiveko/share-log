import type {
  AdjustmentWithCreator,
  AdjustmentListQuery,
  CreateAdjustmentDto,
  UpdateAdjustmentDto,
} from "@repo/interfaces";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { API } from "@web/api";
import { logger } from "@web/lib/logger";

type StateStatus = "idle" | "loading" | "success" | "error";

interface AdjustmentState {
  adjustments: AdjustmentWithCreator[];
  currentAdjustment: AdjustmentWithCreator | null;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  status: StateStatus;
  detailStatus: StateStatus;
  filter: AdjustmentListQuery;
}

interface AdjustmentActions {
  fetchAdjustments: (workspaceId: number, query?: AdjustmentListQuery) => Promise<void>;
  loadMore: (workspaceId: number) => Promise<void>;
  fetchAdjustment: (workspaceId: number, adjustmentId: number) => Promise<void>;
  createAdjustment: (workspaceId: number, dto: CreateAdjustmentDto) => Promise<AdjustmentWithCreator>;
  updateAdjustment: (
    workspaceId: number,
    adjustmentId: number,
    dto: UpdateAdjustmentDto
  ) => Promise<AdjustmentWithCreator>;
  deleteAdjustment: (workspaceId: number, adjustmentId: number) => Promise<void>;
  completeAdjustment: (workspaceId: number, adjustmentId: number) => Promise<AdjustmentWithCreator>;
  setFilter: (filter: AdjustmentListQuery) => void;
  reset: () => void;
}

export type AdjustmentStore = AdjustmentState & AdjustmentActions;

const DEFAULT_LIMIT = 20;

const initialState: AdjustmentState = {
  adjustments: [],
  currentAdjustment: null,
  total: 0,
  page: 1,
  limit: DEFAULT_LIMIT,
  hasMore: false,
  status: "idle",
  detailStatus: "idle",
  filter: {},
};

export const useAdjustmentStore = create<AdjustmentStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      fetchAdjustments: async (workspaceId: number, query?: AdjustmentListQuery) => {
        try {
          set((state) => {
            state.status = "loading";
            state.filter = query ?? {};
          });
          const result = await API.adjustment.list(workspaceId, {
            ...query,
            page: 1,
            limit: DEFAULT_LIMIT,
          });
          set((state) => {
            state.adjustments = result.adjustments;
            state.total = result.total;
            state.page = result.page;
            state.limit = result.limit;
            state.hasMore = result.hasMore;
            state.status = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.status = "error";
          });
        }
      },

      loadMore: async (workspaceId: number) => {
        const { hasMore, page, filter, status } = get();
        if (!hasMore || status === "loading") return;

        try {
          set((state) => {
            state.status = "loading";
          });
          const nextPage = page + 1;
          const result = await API.adjustment.list(workspaceId, {
            ...filter,
            page: nextPage,
            limit: DEFAULT_LIMIT,
          });
          set((state) => {
            state.adjustments = [...state.adjustments, ...result.adjustments];
            state.total = result.total;
            state.page = result.page;
            state.limit = result.limit;
            state.hasMore = result.hasMore;
            state.status = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.status = "error";
          });
        }
      },

      fetchAdjustment: async (workspaceId: number, adjustmentId: number) => {
        try {
          set((state) => {
            state.detailStatus = "loading";
          });
          const adjustment = await API.adjustment.get(workspaceId, adjustmentId);
          set((state) => {
            state.currentAdjustment = adjustment;
            state.detailStatus = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.detailStatus = "error";
          });
        }
      },

      createAdjustment: async (workspaceId: number, dto: CreateAdjustmentDto) => {
        const adjustment = await API.adjustment.create(workspaceId, dto);
        set((state) => {
          state.adjustments.unshift(adjustment);
          state.total += 1;
        });
        return adjustment;
      },

      updateAdjustment: async (
        workspaceId: number,
        adjustmentId: number,
        dto: UpdateAdjustmentDto
      ) => {
        const adjustment = await API.adjustment.update(workspaceId, adjustmentId, dto);
        set((state) => {
          const index = state.adjustments.findIndex((a) => a.id === adjustmentId);
          if (index !== -1) {
            state.adjustments[index] = adjustment;
          }
          if (state.currentAdjustment?.id === adjustmentId) {
            state.currentAdjustment = adjustment;
          }
        });
        return adjustment;
      },

      deleteAdjustment: async (workspaceId: number, adjustmentId: number) => {
        await API.adjustment.remove(workspaceId, adjustmentId);
        set((state) => {
          state.adjustments = state.adjustments.filter((a) => a.id !== adjustmentId);
          state.total -= 1;
          if (state.currentAdjustment?.id === adjustmentId) {
            state.currentAdjustment = null;
          }
        });
      },

      completeAdjustment: async (workspaceId: number, adjustmentId: number) => {
        const adjustment = await API.adjustment.complete(workspaceId, adjustmentId);
        set((state) => {
          const index = state.adjustments.findIndex((a) => a.id === adjustmentId);
          if (index !== -1) {
            state.adjustments[index] = adjustment;
          }
          if (state.currentAdjustment?.id === adjustmentId) {
            state.currentAdjustment = adjustment;
          }
        });
        return adjustment;
      },

      setFilter: (filter: AdjustmentListQuery) => {
        set((state) => {
          state.filter = filter;
        });
      },

      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },
    })),
    { name: "adjustment" }
  )
);
