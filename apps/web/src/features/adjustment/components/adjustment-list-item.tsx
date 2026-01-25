import { Link } from "react-router";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@web/components/ui/button";
import type { AdjustmentWithCreator } from "@repo/interfaces";
import { AdjustmentStatus } from "@repo/interfaces";

interface AdjustmentListItemProps {
  adjustment: AdjustmentWithCreator;
  workspaceId: number;
  currentUserId: number;
  onDelete: (adjustmentId: number) => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

const formatDateRange = (startDate: Date, endDate: Date): string => {
  return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
};

export function AdjustmentListItem({
  adjustment,
  workspaceId,
  currentUserId,
  onDelete,
}: AdjustmentListItemProps) {
  const isCreator = adjustment.creatorId === currentUserId;
  const isCompleted = adjustment.status === AdjustmentStatus.COMPLETED;
  const totalExpense = adjustment.result?.totalExpense ?? 0;
  const participantCount = adjustment.result?.userExpenses?.length ?? 0;

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <Link
        to={`/workspace/${workspaceId}/adjustment/${adjustment.id}`}
        className="flex-1 min-w-0"
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{adjustment.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isCompleted
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {isCompleted ? "완료" : "진행중"}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDateRange(adjustment.startDate, adjustment.endDate)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {participantCount}명 참여 | 총 {formatCurrency(totalExpense)}
            </div>
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-2 ml-4">
        <div className="text-sm text-muted-foreground">
          {adjustment.creator.nickname || "알 수 없음"}
        </div>
        {isCreator && !isCompleted && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <Link to={`/workspace/${workspaceId}/adjustment/${adjustment.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={(e) => {
                e.preventDefault();
                onDelete(adjustment.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        {isCompleted && (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
      </div>
    </div>
  );
}
