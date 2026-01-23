import type {
  StatsQuery,
  DailyStat,
  MethodStat,
  CategoryStat,
  UserStat,
  StatsSummary,
} from "@repo/interfaces";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { API } from "@web/api";
import { logger } from "@web/lib/logger";

type StateStatus = "idle" | "loading" | "success" | "error";

interface StatsState {
  dailyData: DailyStat[];
  methodStats: MethodStat[];
  categoryStats: CategoryStat[];
  userStats: UserStat[];
  summary: StatsSummary;
  status: StateStatus;
  filter: StatsQuery;
}

interface StatsActions {
  fetchStats: (workspaceId: number, query?: StatsQuery) => Promise<void>;
  setFilter: (filter: StatsQuery) => void;
  reset: () => void;
}

export type StatsStore = StatsState & StatsActions;

const initialSummary: StatsSummary = {
  totalExpense: 0,
  totalIncome: 0,
  balance: 0,
};

const initialState: StatsState = {
  dailyData: [],
  methodStats: [],
  categoryStats: [],
  userStats: [],
  summary: initialSummary,
  status: "idle",
  filter: {},
};

export const useStatsStore = create<StatsStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      fetchStats: async (workspaceId: number, query?: StatsQuery) => {
        try {
          set((state) => {
            state.status = "loading";
            state.filter = query ?? {};
          });
          const stats = await API.stats.getStats(workspaceId, query);
          set((state) => {
            state.dailyData = stats.dailyData;
            state.methodStats = stats.methodStats;
            state.categoryStats = stats.categoryStats;
            state.userStats = stats.userStats;
            state.summary = stats.summary;
            state.status = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.status = "error";
          });
        }
      },

      setFilter: (filter: StatsQuery) => {
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
    { name: "stats" }
  )
);
