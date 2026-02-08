import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@web/components/ui/button";
import { Badge } from "@web/components/ui/badge";
import { CategoryBadge } from "@web/features/category/components/category-badge";
import { formatCurrency, formatDateShort } from "@web/lib/format";
import type { LogWithRelations } from "@repo/interfaces";
import { LogType } from "@repo/interfaces";

interface LogListItemProps {
  log: LogWithRelations;
  currentUserId: number;
  onEdit: (log: LogWithRelations) => void;
  onDelete: (logId: number) => void;
}

export function LogListItem({
  log,
  currentUserId,
  onEdit,
  onDelete,
}: LogListItemProps) {
  const isOwner = log.userId === currentUserId;
  const isExpense = log.type === LogType.EXPENSE;

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground w-20">
          {formatDateShort(log.date)}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Badge variant={isExpense ? "expense" : "income"}>
              {isExpense ? "지출" : "수입"}
            </Badge>
            {log.description && (
              <span className="text-sm font-medium">
                {log.description}
              </span>
            )}
            {log.category && (
              <CategoryBadge name={log.category.name} color={log.category.color} />
            )}
            {log.method && (
              <span className="text-xs text-muted-foreground">
                {log.method.name}
              </span>
            )}
          </div>
          {log.memo && (
            <p className="text-sm text-muted-foreground mt-1">{log.memo}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden border shrink-0">
            {log.user.avatarUrl ? (
              <img
                src={log.user.avatarUrl}
                alt={log.user.nickname || "사용자"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                {(log.user.nickname?.[0] || "?").toUpperCase()}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground w-16 truncate">
            {log.user.nickname || "알 수 없음"}
          </span>
        </div>
        <span
          className={`font-semibold w-24 text-right ${
            isExpense ? "text-red-500" : "text-green-500"
          }`}
        >
          {isExpense ? "-" : "+"}
          {formatCurrency(log.amount)}
        </span>
        <div className="flex gap-1 w-[68px]">
          {isOwner && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(log)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => onDelete(log.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
