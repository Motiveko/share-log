import type {
  LogWithRelations,
  LogListQuery,
  CreateLogDto,
  UpdateLogDto,
} from "@repo/interfaces";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { API } from "@web/api";
import { logger } from "@web/lib/logger";

type StateStatus = "idle" | "loading" | "success" | "error";

interface LogState {
  logs: LogWithRelations[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  status: StateStatus;
  filter: LogListQuery;
}

interface LogActions {
  fetchLogs: (workspaceId: number, query?: LogListQuery) => Promise<void>;
  loadMore: (workspaceId: number) => Promise<void>;
  createLog: (workspaceId: number, dto: CreateLogDto) => Promise<LogWithRelations>;
  updateLog: (workspaceId: number, logId: number, dto: UpdateLogDto) => Promise<LogWithRelations>;
  deleteLog: (workspaceId: number, logId: number) => Promise<void>;
  setFilter: (filter: LogListQuery) => void;
  reset: () => void;
}

export type LogStore = LogState & LogActions;

const DEFAULT_LIMIT = 20;

const initialState: LogState = {
  logs: [],
  total: 0,
  page: 1,
  limit: DEFAULT_LIMIT,
  hasMore: false,
  status: "idle",
  filter: {},
};

export const useLogStore = create<LogStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      fetchLogs: async (workspaceId: number, query?: LogListQuery) => {
        try {
          set((state) => {
            state.status = "loading";
            state.filter = query ?? {};
          });
          const result = await API.log.list(workspaceId, {
            ...query,
            page: 1,
            limit: DEFAULT_LIMIT,
          });
          set((state) => {
            state.logs = result.logs;
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
          const result = await API.log.list(workspaceId, {
            ...filter,
            page: nextPage,
            limit: DEFAULT_LIMIT,
          });
          set((state) => {
            state.logs = [...state.logs, ...result.logs];
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

      createLog: async (workspaceId: number, dto: CreateLogDto) => {
        const log = await API.log.create(workspaceId, dto);
        set((state) => {
          state.logs.unshift(log);
          state.total += 1;
        });
        return log;
      },

      updateLog: async (
        workspaceId: number,
        logId: number,
        dto: UpdateLogDto
      ) => {
        const log = await API.log.update(workspaceId, logId, dto);
        set((state) => {
          const index = state.logs.findIndex((l) => l.id === logId);
          if (index !== -1) {
            state.logs[index] = log;
          }
        });
        return log;
      },

      deleteLog: async (workspaceId: number, logId: number) => {
        await API.log.remove(workspaceId, logId);
        set((state) => {
          state.logs = state.logs.filter((l) => l.id !== logId);
          state.total -= 1;
        });
      },

      setFilter: (filter: LogListQuery) => {
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
    { name: "log" }
  )
);
