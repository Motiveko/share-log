// Log interfaces

export enum LogType {
  EXPENSE = "expense", // 지출
  INCOME = "income", // 수입
}

export enum DefaultMethodType {
  CREDIT_CARD = "credit_card", // 신용카드
  DEBIT_CARD = "debit_card", // 체크카드
  CASH = "cash", // 현금
}

export interface LogCategory {
  id: number;
  workspaceId: number;
  name: string;
  sortOrder: number;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LogMethod {
  id: number;
  workspaceId: number;
  defaultType?: DefaultMethodType | null;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Log {
  id: number;
  workspaceId: number;
  type: LogType;
  categoryId?: number | null;
  methodId?: number | null;
  date: Date;
  amount: number;
  description?: string | null;
  memo?: string | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Log with relations for response
export interface LogWithRelations extends Log {
  category?: LogCategory | null;
  method?: LogMethod | null;
  user: {
    id: number;
    nickname?: string | null;
    avatarUrl?: string;
  };
}

// DTOs
export interface CreateLogDto {
  type: LogType;
  amount: number;
  date: string; // ISO date string
  description?: string;
  memo?: string;
  categoryId?: number;
  methodId?: number;
}

export interface UpdateLogDto {
  type?: LogType;
  amount?: number;
  date?: string;
  description?: string | null;
  memo?: string | null;
  categoryId?: number | null;
  methodId?: number | null;
}

export interface LogListQuery {
  startDate?: string;
  endDate?: string;
  type?: LogType;
  userId?: number;
  categoryId?: number;
  methodId?: number;
  page?: number; // default: 1
  limit?: number; // default: 20
}

export interface LogListResponse {
  logs: LogWithRelations[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Category DTOs
export interface CreateCategoryDto {
  name: string;
  sortOrder?: number;
  color?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  sortOrder?: number;
  color?: string | null;
}

// Method DTOs
export interface CreateMethodDto {
  name: string;
  sortOrder?: number;
}

export interface UpdateMethodDto {
  name?: string;
  sortOrder?: number;
}

// Stats DTOs
export interface StatsQuery {
  startDate?: string;
  endDate?: string;
  userId?: number;
  categoryId?: number;
  methodId?: number;
}

export interface DailyStat {
  date: string;
  expense: number;
  income: number;
}

export interface MethodStat {
  methodId: number | null;
  methodName: string;
  expense: number;
}

export interface CategoryStat {
  categoryId: number | null;
  categoryName: string;
  expense: number;
  income: number;
}

export interface UserStat {
  userId: number;
  nickname?: string | null;
  avatarUrl?: string;
  expense: number;
  income: number;
  count: number;
}

export interface StatsSummary {
  totalExpense: number;
  totalIncome: number;
  balance: number;
}

export interface StatsResponse {
  dailyData: DailyStat[];
  methodStats: MethodStat[];
  categoryStats: CategoryStat[];
  userStats: UserStat[];
  summary: StatsSummary;
}
