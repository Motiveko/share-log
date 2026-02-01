"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { ko } from "date-fns/locale";
import { IoCalendarOutline } from "react-icons/io5";
import { Button } from "@web/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@web/components/ui/popover";
import { Calendar } from "@web/components/ui/calendar";
import { cn } from "@web/lib/utils";

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    { value, onChange, placeholder = "날짜 선택", className, disabled },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const selectedDate = React.useMemo(() => {
      if (!value) return undefined;
      const parsed = parse(value, "yyyy-MM-dd", new Date());
      return isValid(parsed) ? parsed : undefined;
    }, [value]);

    const handleSelect = (date: Date | undefined) => {
      if (date) {
        onChange?.(format(date, "yyyy-MM-dd"));
      }
      setOpen(false);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            <IoCalendarOutline className="mr-2 size-4" />
            {selectedDate ? (
              format(selectedDate, "yyyy년 M월 d일", { locale: ko })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  }
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
