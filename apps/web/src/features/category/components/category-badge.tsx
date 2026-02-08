import { Badge } from "@web/components/ui/badge";
import { getContrastTextColor } from "@web/lib/color";

interface CategoryBadgeProps {
  name: string;
  color?: string | null;
}

export function CategoryBadge({ name, color }: CategoryBadgeProps) {
  if (!color) {
    return <Badge variant="muted">{name}</Badge>;
  }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded"
      style={{
        backgroundColor: color,
        color: getContrastTextColor(color),
      }}
    >
      {name}
    </span>
  );
}
