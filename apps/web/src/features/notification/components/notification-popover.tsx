import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@web/components/ui/popover";
import { Button } from "@web/components/ui/button";
import { Spinner } from "@web/components/ui/spinner";
import { useNotificationStore } from "@web/features/notification/store";
import { NotificationIcon } from "./notification-icon";
import { NotificationListItem } from "./notification-list-item";

export function NotificationPopover() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    hasUnread,
    hasMore,
    status,
    loadMoreStatus,
    fetchNotifications,
    loadMore,
    checkUnread,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  // 초기 안 읽음 상태 확인
  useEffect(() => {
    checkUnread();
  }, [checkUnread]);

  const handleOpenChange = (open: boolean) => {
    if (open && status === "idle") {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification: (typeof notifications)[0]) => {
    // 읽음 처리
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // landing URL로 이동
    if (notification.data?.landingUrl) {
      const url = new URL(notification.data.landingUrl);
      navigate(url.pathname);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch {
      // error handled in store
    }
  };

  // 무한 스크롤
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (isNearBottom && hasMore && loadMoreStatus !== "loading") {
      loadMore();
    }
  }, [hasMore, loadMoreStatus, loadMore]);

  const hasNotifications = notifications.length > 0;
  const isLoading = status === "loading";
  const hasUnreadNotifications = notifications.some((n) => !n.isRead);

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <NotificationIcon hasUnread={hasUnread} />
          <span className="sr-only">알림</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 max-h-[400px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">알림</h3>
          {hasUnreadNotifications && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={handleMarkAllAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              모두 읽음
            </Button>
          )}
        </div>

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : !hasNotifications ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              알림이 없습니다.
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationListItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
              {loadMoreStatus === "loading" && (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="h-4 w-4" />
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
