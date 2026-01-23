import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@web/components/ui/button";
import type { LogWithRelations } from "@repo/interfaces";
import { LogType } from "@repo/interfaces";

interface LogListItemProps {
  log: LogWithRelations;
  currentUserId: number;
  onEdit: (log: LogWithRelations) => void;
  onDelete: (logId: number) => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(date));
};

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
          {formatDate(log.date)}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                isExpense
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {isExpense ? "지출" : "수입"}
            </span>
            {log.category && (
              <span className="text-xs text-muted-foreground">
                {log.category.name}
              </span>
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
        <div className="flex flex-col items-end">
          <span
            className={`font-semibold ${
              isExpense ? "text-red-500" : "text-green-500"
            }`}
          >
            {isExpense ? "-" : "+"}
            {formatCurrency(log.amount)}
          </span>
          <span className="text-xs text-muted-foreground">
            {log.user.nickname || "알 수 없음"}
          </span>
        </div>
        {isOwner && (
          <div className="flex gap-1">
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
          </div>
        )}
      </div>
    </div>
  );
}
