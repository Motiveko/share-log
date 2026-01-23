import * as React from "react";
import { Input } from "@web/components/ui/input";
import { cn } from "@web/lib/utils";

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, placeholder = "날짜 선택", className, disabled }, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn("w-full", className)}
        disabled={disabled}
      />
    );
  }
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
