import type {
  StatsResponse,
  StatsQuery,
  DailyStat,
  MethodStat,
  CategoryStat,
  UserStat,
  StatsSummary,
} from "@repo/interfaces";
import { z } from "zod";
import { baseHttpClient } from "@web/api/http-client";
import type { DataAndMessageResponse } from "@web/api/types";

// Schemas
const DailyStatSchema: z.ZodType<DailyStat> = z.object({
  date: z.string(),
  expense: z.number(),
  income: z.number(),
});

const MethodStatSchema: z.ZodType<MethodStat> = z.object({
  methodId: z.number().nullable(),
  methodName: z.string(),
  expense: z.number(),
});

const CategoryStatSchema: z.ZodType<CategoryStat> = z.object({
  categoryId: z.number().nullable(),
  categoryName: z.string(),
  expense: z.number(),
  income: z.number(),
});

const UserStatSchema: z.ZodType<UserStat> = z.object({
  userId: z.number(),
  nickname: z.string().nullable().optional(),
  avatarUrl: z.string().optional(),
  expense: z.number(),
  income: z.number(),
  count: z.number(),
});

const StatsSummarySchema: z.ZodType<StatsSummary> = z.object({
  totalExpense: z.number(),
  totalIncome: z.number(),
  balance: z.number(),
});

const StatsResponseSchema: z.ZodType<StatsResponse> = z.object({
  dailyData: z.array(DailyStatSchema),
  methodStats: z.array(MethodStatSchema),
  categoryStats: z.array(CategoryStatSchema),
  userStats: z.array(UserStatSchema),
  summary: StatsSummarySchema,
});

// Response Schemas
const GetStatsResponseSchema: z.ZodType<DataAndMessageResponse<StatsResponse>> = z.object({
  data: StatsResponseSchema,
  message: z.string(),
});

// API Functions

/**
 * 통계 데이터 조회
 */
export const getStats = async (workspaceId: number, query?: StatsQuery) => {
  const params = new URLSearchParams();
  if (query?.startDate) params.set("startDate", query.startDate);
  if (query?.endDate) params.set("endDate", query.endDate);
  if (query?.userId) params.set("userId", String(query.userId));
  if (query?.categoryId) params.set("categoryId", String(query.categoryId));
  if (query?.methodId) params.set("methodId", String(query.methodId));

  const queryString = params.toString();
  const url = `/api/v1/workspaces/${workspaceId}/stats${queryString ? `?${queryString}` : ""}`;

  const response = await baseHttpClient.get<typeof GetStatsResponseSchema>(url, {
    schema: GetStatsResponseSchema,
  });
  return response.data;
};
