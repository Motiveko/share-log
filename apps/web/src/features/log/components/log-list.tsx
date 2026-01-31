import { useEffect, useRef, useCallback } from "react";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import { Spinner } from "@web/components/ui/spinner";
import { EmptyState } from "@web/components/ui/empty-state";
import { LogListItem } from "@web/features/log/components/log-list-item";
import { useLogStore } from "@web/features/log/store";
import type { LogWithRelations, LogListQuery } from "@repo/interfaces";

interface LogListProps {
  workspaceId: number;
  currentUserId: number;
  filter?: LogListQuery;
  onEdit: (log: LogWithRelations) => void;
  onDelete: (logId: number) => void;
}

export function LogList({
  workspaceId,
  currentUserId,
  filter,
  onEdit,
  onDelete,
}: LogListProps) {
  const { logs, hasMore, status, fetchLogs, loadMore } = useLogStore();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void fetchLogs(workspaceId, filter);
  }, [workspaceId, filter, fetchLogs]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && status !== "loading") {
        void loadMore(workspaceId);
      }
    },
    [hasMore, status, loadMore, workspaceId]
  );

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>기록 목록</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length === 0 && status !== "loading" ? (
          <EmptyState
            icon={FileText}
            title="등록된 기록이 없습니다"
            description="새로운 기록을 추가해보세요."
          />
        ) : (
          <div>
            {logs.map((log) => (
              <LogListItem
                key={log.id}
                log={log}
                currentUserId={currentUserId}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            <div ref={loadMoreRef} className="h-4" />
            {status === "loading" && (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
