import { useEffect } from "react";
import { useParams, Link } from "react-router";
import { Plus, Receipt } from "lucide-react";
import { Button } from "@web/components/ui/button";
import { Spinner } from "@web/components/ui/spinner";
import { EmptyState } from "@web/components/ui/empty-state";
import { LoadingOverlay } from "@web/components/ui/loading";
import { useAdjustmentStore } from "@web/features/adjustment/store";
import { useAuthStore } from "@web/features/auth/store";
import { AdjustmentListItem } from "@web/features/adjustment/components/adjustment-list-item";

function AdjustmentListPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const workspaceIdNum = workspaceId ? parseInt(workspaceId, 10) : 0;

  const { adjustments, fetchAdjustments, deleteAdjustment, status, hasMore, loadMore } =
    useAdjustmentStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (workspaceIdNum) {
      void fetchAdjustments(workspaceIdNum);
    }
  }, [workspaceIdNum, fetchAdjustments]);

  const handleDelete = async (adjustmentId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deleteAdjustment(workspaceIdNum, adjustmentId);
  };

  const handleLoadMore = () => {
    void loadMore(workspaceIdNum);
  };

  if (status === "loading" && adjustments.length === 0) {
    return <LoadingOverlay />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">정산</h1>
          <p className="text-muted-foreground">공동 지출을 정산하세요</p>
        </div>
        <Button asChild>
          <Link to={`/workspace/${workspaceIdNum}/adjustment/new`}>
            <Plus className="h-4 w-4 mr-2" />
            새 정산
          </Link>
        </Button>
      </div>

      {/* List */}
      <div className="border rounded-lg">
        {adjustments.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="아직 정산 내역이 없습니다"
            description="새 정산을 시작해보세요."
            action={
              <Button asChild>
                <Link to={`/workspace/${workspaceIdNum}/adjustment/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  새 정산
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            {adjustments.map((adjustment) => (
              <AdjustmentListItem
                key={adjustment.id}
                adjustment={adjustment}
                workspaceId={workspaceIdNum}
                currentUserId={user?.id ?? 0}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <Spinner size="sm" className="mr-2" />
                로딩 중...
              </>
            ) : (
              "더 보기"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default AdjustmentListPage;
