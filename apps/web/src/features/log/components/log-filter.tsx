import { useEffect, useState, useRef } from "react";
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

export function LogFilter({ workspaceId, onFilterChange }: LogFilterProps) {
  const { categories, fetchCategories } = useCategoryStore();
  const { methods, fetchMethods } = useMethodStore();
  const { members, fetchMembers } = useWorkspaceStore();

  const ALL_VALUE = "all";

  const [dateRange, setDateRange] = useState<DateRange>(getCurrentMonthRange);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [type, setType] = useState<string>(ALL_VALUE);
  const [userId, setUserId] = useState<string>(ALL_VALUE);
  const [categoryId, setCategoryId] = useState<string>(ALL_VALUE);
  const [methodId, setMethodId] = useState<string>(ALL_VALUE);

  const initializedRef = useRef(false);

  useEffect(() => {
    void fetchCategories(workspaceId);
    void fetchMethods(workspaceId);
    void fetchMembers(workspaceId);
  }, [workspaceId, fetchCategories, fetchMethods, fetchMembers]);

  // Initial filter with current month on mount
  useEffect(() => {
    if (!initializedRef.current && workspaceId) {
      initializedRef.current = true;
      const currentMonthRange = getCurrentMonthRange();
      onFilterChange({
        startDate: currentMonthRange.startDate,
        endDate: currentMonthRange.endDate,
      });
    }
  }, [workspaceId, onFilterChange]);

  const handleApplyFilter = () => {
    const filter: LogListQuery = {};
    if (dateRange.startDate) filter.startDate = dateRange.startDate;
    if (dateRange.endDate) filter.endDate = dateRange.endDate;
    if (type !== ALL_VALUE) filter.type = type as LogType;
    if (userId !== ALL_VALUE) filter.userId = Number(userId);
    if (categoryId !== ALL_VALUE) filter.categoryId = Number(categoryId);
    if (methodId !== ALL_VALUE) filter.methodId = Number(methodId);
    onFilterChange(filter);
  };

  const handleReset = () => {
    const currentMonthRange = getCurrentMonthRange();
    setDateRange(currentMonthRange);
    setType(ALL_VALUE);
    setUserId(ALL_VALUE);
    setCategoryId(ALL_VALUE);
    setMethodId(ALL_VALUE);
    onFilterChange({
      startDate: currentMonthRange.startDate,
      endDate: currentMonthRange.endDate,
    });
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    // Apply filter immediately when date range changes
    const filter: LogListQuery = {};
    if (range.startDate) filter.startDate = range.startDate;
    if (range.endDate) filter.endDate = range.endDate;
    if (type !== ALL_VALUE) filter.type = type as LogType;
    if (userId !== ALL_VALUE) filter.userId = Number(userId);
    if (categoryId !== ALL_VALUE) filter.categoryId = Number(categoryId);
    if (methodId !== ALL_VALUE) filter.methodId = Number(methodId);
    onFilterChange(filter);
  };

  return (
    <div className="flex flex-wrap gap-3 items-end">
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
        <SelectTrigger className="w-28">
          <SelectValue placeholder="유형" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>전체</SelectItem>
          <SelectItem value="expense">지출</SelectItem>
          <SelectItem value="income">수입</SelectItem>
        </SelectContent>
      </Select>

      <Select value={userId} onValueChange={setUserId}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="사용자" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>전체</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.userId} value={String(member.userId)}>
              {member.user.nickname || member.user.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={categoryId} onValueChange={setCategoryId}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="카테고리" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>전체</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={String(cat.id)}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={methodId} onValueChange={setMethodId}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="수단" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>전체</SelectItem>
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
