import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@web/components/ui/select";
import { Button } from "@web/components/ui/button";
import {
  DateRangePickerModal,
  getCurrentMonthRange,
  formatDateRangeDisplay,
  type DateRange,
} from "@web/components/ui/date-range-picker-modal";
import { useCategoryStore } from "@web/features/category/store";
import { useMethodStore } from "@web/features/method/store";
import { useWorkspaceStore } from "@web/features/workspace/store";
import type { LogListQuery, LogType } from "@repo/interfaces";

interface LogFilterProps {
  workspaceId: number;
  onFilterChange: (filter: LogListQuery) => void;
}

const ALL_VALUE = "all";

function getFilterFromSearchParams(searchParams: URLSearchParams): {
  dateRange: DateRange;
  type: string;
  userId: string;
  categoryId: string;
  methodId: string;
} {
  const defaultRange = getCurrentMonthRange();
  return {
    dateRange: {
      startDate: searchParams.get("startDate") ?? defaultRange.startDate,
      endDate: searchParams.get("endDate") ?? defaultRange.endDate,
    },
    type: searchParams.get("type") ?? ALL_VALUE,
    userId: searchParams.get("userId") ?? ALL_VALUE,
    categoryId: searchParams.get("categoryId") ?? ALL_VALUE,
    methodId: searchParams.get("methodId") ?? ALL_VALUE,
  };
}

function buildLogListQuery(params: {
  dateRange: DateRange;
  type: string;
  userId: string;
  categoryId: string;
  methodId: string;
}): LogListQuery {
  const filter: LogListQuery = {};
  if (params.dateRange.startDate) filter.startDate = params.dateRange.startDate;
  if (params.dateRange.endDate) filter.endDate = params.dateRange.endDate;
  if (params.type !== ALL_VALUE) filter.type = params.type as LogType;
  if (params.userId !== ALL_VALUE) filter.userId = Number(params.userId);
  if (params.categoryId !== ALL_VALUE) filter.categoryId = Number(params.categoryId);
  if (params.methodId !== ALL_VALUE) filter.methodId = Number(params.methodId);
  return filter;
}

export function LogFilter({ workspaceId, onFilterChange }: LogFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, fetchCategories } = useCategoryStore();
  const { methods, fetchMethods } = useMethodStore();
  const { members, fetchMembers } = useWorkspaceStore();

  const initialParams = getFilterFromSearchParams(searchParams);
  const [dateRange, setDateRange] = useState<DateRange>(initialParams.dateRange);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [type, setType] = useState<string>(initialParams.type);
  const [userId, setUserId] = useState<string>(initialParams.userId);
  const [categoryId, setCategoryId] = useState<string>(initialParams.categoryId);
  const [methodId, setMethodId] = useState<string>(initialParams.methodId);

  const updateSearchParams = useCallback(
    (params: {
      dateRange: DateRange;
      type: string;
      userId: string;
      categoryId: string;
      methodId: string;
    }) => {
      const defaultRange = getCurrentMonthRange();
      const newParams = new URLSearchParams();

      // 디폴트 값이 아닌 경우에만 URL에 포함
      if (params.dateRange.startDate && params.dateRange.startDate !== defaultRange.startDate) {
        newParams.set("startDate", params.dateRange.startDate);
      }
      if (params.dateRange.endDate && params.dateRange.endDate !== defaultRange.endDate) {
        newParams.set("endDate", params.dateRange.endDate);
      }
      if (params.type !== ALL_VALUE) {
        newParams.set("type", params.type);
      }
      if (params.userId !== ALL_VALUE) {
        newParams.set("userId", params.userId);
      }
      if (params.categoryId !== ALL_VALUE) {
        newParams.set("categoryId", params.categoryId);
      }
      if (params.methodId !== ALL_VALUE) {
        newParams.set("methodId", params.methodId);
      }

      setSearchParams(newParams);
    },
    [setSearchParams]
  );

  useEffect(() => {
    void fetchCategories(workspaceId);
    void fetchMethods(workspaceId);
    void fetchMembers(workspaceId);
  }, [workspaceId, fetchCategories, fetchMethods, fetchMembers]);

  // URL 파라미터 변경 시 (초기 로드, 뒤로가기/앞으로가기) 필터 상태 동기화 및 데이터 fetch
  useEffect(() => {
    if (!workspaceId) return;

    const params = getFilterFromSearchParams(searchParams);

    // 상태 동기화
    setDateRange(params.dateRange);
    setType(params.type);
    setUserId(params.userId);
    setCategoryId(params.categoryId);
    setMethodId(params.methodId);

    onFilterChange(buildLogListQuery(params));
  }, [workspaceId, searchParams, onFilterChange]);

  const handleApplyFilter = () => {
    const params = { dateRange, type, userId, categoryId, methodId };
    updateSearchParams(params);
    // onFilterChange는 useEffect에서 searchParams 변경 감지 시 호출됨
  };

  const handleReset = () => {
    setSearchParams(new URLSearchParams());
    // 상태 초기화와 onFilterChange는 useEffect에서 searchParams 변경 감지 시 처리됨
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    // Apply filter immediately when date range changes
    const params = { dateRange: range, type, userId, categoryId, methodId };
    updateSearchParams(params);
    // onFilterChange는 useEffect에서 searchParams 변경 감지 시 호출됨
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Date Range Picker Button */}
      <Button
        variant="outline"
        onClick={() => setDatePickerOpen(true)}
        className="min-w-48 justify-start"
      >
        <Calendar className="h-4 w-4 mr-2" />
        {formatDateRangeDisplay(dateRange)}
      </Button>

      <DateRangePickerModal
        open={datePickerOpen}
        onOpenChange={setDatePickerOpen}
        value={dateRange}
        onChange={handleDateRangeChange}
      />

      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="유형" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>유형: 전체</SelectItem>
          <SelectItem value="expense">지출</SelectItem>
          <SelectItem value="income">수입</SelectItem>
        </SelectContent>
      </Select>

      <Select value={userId} onValueChange={setUserId}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="사용자" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>사용자: 전체</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.userId} value={String(member.userId)}>
              {member.user.nickname || member.user.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={categoryId} onValueChange={setCategoryId}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="카테고리" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>카테고리: 전체</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={String(cat.id)}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={methodId} onValueChange={setMethodId}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="수단" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>수단: 전체</SelectItem>
          {methods.map((method) => (
            <SelectItem key={method.id} value={String(method.id)}>
              {method.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Button onClick={handleApplyFilter} size="sm">
          적용
        </Button>
        <Button onClick={handleReset} variant="outline" size="sm">
          초기화
        </Button>
      </div>
    </div>
  );
}
