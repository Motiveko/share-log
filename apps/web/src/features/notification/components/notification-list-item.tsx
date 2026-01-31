import type { NotificationResponse } from "@repo/interfaces";
import { cn } from "@web/lib/utils";

interface NotificationListItemProps {
  notification: NotificationResponse;
  onClick: () => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export function NotificationListItem({
  notification,
  onClick,
}: NotificationListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0",
        !notification.isRead && "bg-accent/50"
      )}
    >
      <div className="flex items-start gap-3">
        {!notification.isRead && (
          <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
        )}
        <div className={cn("flex-1 min-w-0", notification.isRead && "pl-5")}>
          <p className="text-sm font-medium truncate">{notification.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.body}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}
