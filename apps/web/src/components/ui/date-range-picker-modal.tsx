import * as React from "react";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@web/components/ui/dialog";
import { Button } from "@web/components/ui/button";
import { DatePicker } from "@web/components/ui/date-picker";
import { cn } from "@web/lib/utils";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const MONTHS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

function getMonthRange(year: number, month: number): DateRange {
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

function getCurrentMonthRange(): DateRange {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth());
}

function formatDateRangeDisplay(range: DateRange): string {
  if (!range.startDate || !range.endDate) {
    return "기간 선택";
  }

  const start = new Date(range.startDate);
  const end = new Date(range.endDate);

  // Check if it's a full month
  const startIsFirstDay = start.getDate() === 1;
  const endIsLastDay = end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
  const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();

  if (startIsFirstDay && endIsLastDay && sameMonth) {
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월`;
  }

  const formatDate = (d: Date) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

  return `${formatDate(start)} ~ ${formatDate(end)}`;
}

export function DateRangePickerModal({
  open,
  onOpenChange,
  value,
  onChange,
}: DateRangePickerModalProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [tempRange, setTempRange] = useState<DateRange>(value);
  const [showCustomRange, setShowCustomRange] = useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setTempRange(value);
      // Determine year from current value
      if (value.startDate) {
        setSelectedYear(new Date(value.startDate).getFullYear());
      } else {
        setSelectedYear(currentYear);
      }
      setShowCustomRange(false);
    }
  }, [open, value, currentYear]);

  const isMonthDisabled = (month: number): boolean => {
    if (selectedYear > currentYear) return true;
    if (selectedYear === currentYear && month > currentMonth) return true;
    return false;
  };

  const isMonthSelected = (month: number): boolean => {
    if (!tempRange.startDate || !tempRange.endDate) return false;
    const start = new Date(tempRange.startDate);
    const expectedRange = getMonthRange(selectedYear, month);
    return tempRange.startDate === expectedRange.startDate &&
           tempRange.endDate === expectedRange.endDate;
  };

  const handleMonthSelect = (month: number) => {
    if (isMonthDisabled(month)) return;
    setTempRange(getMonthRange(selectedYear, month));
  };

  const handlePrevYear = () => {
    setSelectedYear((y) => y - 1);
  };

  const handleNextYear = () => {
    if (selectedYear < currentYear) {
      setSelectedYear((y) => y + 1);
    }
  };

  const handleApply = () => {
    onChange(tempRange);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const canApply = tempRange.startDate && tempRange.endDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>기간 선택</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Year Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevYear}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-lg">{selectedYear}년</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextYear}
              disabled={selectedYear >= currentYear}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-4 gap-2">
            {MONTHS.map((monthName, index) => {
              const disabled = isMonthDisabled(index);
              const selected = isMonthSelected(index);
              return (
                <Button
                  key={monthName}
                  variant={selected ? "default" : "outline"}
                  size="sm"
                  disabled={disabled}
                  onClick={() => handleMonthSelect(index)}
                  className={cn(
                    "h-10",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {monthName}
                </Button>
              );
            })}
          </div>

          {/* Custom Range Toggle */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomRange(!showCustomRange)}
              className="w-full text-muted-foreground"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {showCustomRange ? "직접 범위 선택 숨기기" : "직접 범위 선택"}
            </Button>

            {showCustomRange && (
              <div className="mt-3 p-3 border rounded-md space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground mb-1 block">
                      시작일
                    </label>
                    <DatePicker
                      value={tempRange.startDate}
                      onChange={(date) =>
                        setTempRange((prev) => ({ ...prev, startDate: date }))
                      }
                      placeholder="시작일"
                    />
                  </div>
                  <span className="text-muted-foreground mt-6">~</span>
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground mb-1 block">
                      종료일
                    </label>
                    <DatePicker
                      value={tempRange.endDate}
                      onChange={(date) =>
                        setTempRange((prev) => ({ ...prev, endDate: date }))
                      }
                      placeholder="종료일"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selected Range Display */}
          {tempRange.startDate && tempRange.endDate && (
            <div className="text-center text-sm text-muted-foreground">
              선택된 기간: {formatDateRangeDisplay(tempRange)}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button onClick={handleApply} disabled={!canApply}>
            적용
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { getCurrentMonthRange, formatDateRangeDisplay, getMonthRange };
export type { DateRange };
