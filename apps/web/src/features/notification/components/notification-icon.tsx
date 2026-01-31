import { Bell } from "lucide-react";
import { cn } from "@web/lib/utils";

interface NotificationIconProps {
  hasUnread: boolean;
  className?: string;
}

export function NotificationIcon({ hasUnread, className }: NotificationIconProps) {
  return (
    <div className={cn("relative", className)}>
      <Bell className="h-5 w-5" />
      {hasUnread && (
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive" />
      )}
    </div>
  );
}
