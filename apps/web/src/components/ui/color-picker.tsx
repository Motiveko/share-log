import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@web/lib/utils";
import { Input } from "@web/components/ui/input";
import { PRESET_COLORS, getContrastTextColor } from "@web/lib/color";

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
}

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value ?? "");

  const handleHexChange = (input: string) => {
    setHexInput(input);
    if (HEX_REGEX.test(input)) {
      onChange(input);
    }
  };

  const handlePresetClick = (color: string) => {
    setHexInput(color);
    onChange(color);
  };

  const handleClear = () => {
    setHexInput("");
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-8 gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              "w-7 h-7 rounded-md border border-transparent transition-all flex items-center justify-center",
              "hover:scale-110 hover:border-foreground/20",
              value === color && "ring-2 ring-ring ring-offset-2"
            )}
            style={{ backgroundColor: color }}
            onClick={() => handlePresetClick(color)}
          >
            {value === color && (
              <Check
                className="h-3.5 w-3.5"
                style={{ color: getContrastTextColor(color) }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md border shrink-0"
          style={{
            backgroundColor: value ?? undefined,
          }}
        >
          {!value && (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <X className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <Input
          inputSize="sm"
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#000000"
          className="font-mono"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
          >
            제거
          </button>
        )}
      </div>
    </div>
  );
}
