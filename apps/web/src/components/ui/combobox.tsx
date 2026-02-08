import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@web/components/ui/popover";
import { Input } from "@web/components/ui/input";
import { cn } from "@web/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  noneOption?: ComboboxOption;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "선택하세요",
  emptyText = "결과 없음",
  noneOption,
  className,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Build the full list: noneOption (always shown) + filtered options
  const displayOptions: ComboboxOption[] = noneOption
    ? [noneOption, ...filteredOptions]
    : filteredOptions;

  const selectedLabel =
    noneOption && value === noneOption.value
      ? null
      : (options.find((opt) => opt.value === value)?.label ?? null);

  const selectOption = useCallback(
    (optValue: string) => {
      onValueChange(optValue);
      setOpen(false);
      setSearch("");
      setHighlightedIndex(-1);
    },
    [onValueChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < displayOptions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : displayOptions.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < displayOptions.length) {
          selectOption(displayOptions[highlightedIndex].value);
        } else if (displayOptions.length > 0) {
          selectOption(displayOptions[0].value);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
        setHighlightedIndex(-1);
      }
    },
    [displayOptions, highlightedIndex, selectOption]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[role='option']");
    items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  // Reset state when popover opens
  useEffect(() => {
    if (open) {
      setSearch("");
      setHighlightedIndex(-1);
      // Focus the search input after popover animation
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className={cn("line-clamp-1", !selectedLabel && "text-muted-foreground")}>
            {selectedLabel ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-2" onKeyDown={handleKeyDown}>
          <Input
            ref={inputRef}
            inputSize="sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setHighlightedIndex(-1);
            }}
            placeholder="검색..."
            className="mb-2"
          />
          <div
            ref={listRef}
            role="listbox"
            className="max-h-48 overflow-y-auto"
          >
            {displayOptions.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              displayOptions.map((opt, index) => (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
                    opt.value === value && "font-medium",
                    index === highlightedIndex && "bg-accent text-accent-foreground",
                    opt.value !== value && index !== highlightedIndex && "hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => selectOption(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {opt.value === value && <Check className="h-4 w-4" />}
                  </span>
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
