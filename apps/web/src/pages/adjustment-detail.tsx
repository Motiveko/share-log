import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Pencil, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@web/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import { LoadingOverlay } from "@web/components/ui/loading";
import { EmptyState } from "@web/components/ui/empty-state";
import { useAdjustmentStore } from "@web/features/adjustment/store";
import { useAuthStore } from "@web/features/auth/store";
import { AdjustmentForm } from "@web/features/adjustment/components/adjustment-form";
import { AdjustmentResultView } from "@web/features/adjustment/components/adjustment-result-view";
import { AdjustmentStatus, type UpdateAdjustmentDto } from "@repo/interfaces";
import { modalService } from "@web/features/modal";

function AdjustmentDetailPage() {
  const { workspaceId, adjustmentId } = useParams<{
    workspaceId: string;
    adjustmentId: string;
  }>();
  const navigate = useNavigate();
  const workspaceIdNum = workspaceId ? parseInt(workspaceId, 10) : 0;
  const adjustmentIdNum = adjustmentId ? parseInt(adjustmentId, 10) : 0;

  const {
    currentAdjustment,
    fetchAdjustment,
    updateAdjustment,
    deleteAdjustment,
    completeAdjustment,
    detailStatus,
  } = useAdjustmentStore();
  const { user } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (workspaceIdNum && adjustmentIdNum) {
      void fetchAdjustment(workspaceIdNum, adjustmentIdNum);
    }
  }, [workspaceIdNum, adjustmentIdNum, fetchAdjustment]);

  const isCreator = currentAdjustment?.creatorId === user?.id;
  const isCompleted = currentAdjustment?.status === AdjustmentStatus.COMPLETED;

  const handleUpdate = async (data: UpdateAdjustmentDto) => {
    await updateAdjustment(workspaceIdNum, adjustmentIdNum, data);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const confirmed = await modalService.destructive("정말 삭제하시겠습니까?");
    if (!confirmed) return;
    setIsProcessing(true);
    try {
      await deleteAdjustment(workspaceIdNum, adjustmentIdNum);
      navigate(`/workspace/${workspaceIdNum}/adjustment`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    const confirmed = await modalService.confirm(
      "정산을 완료 처리하시겠습니까? 완료 후에는 수정할 수 없습니다.",
      { title: "정산 완료", confirmText: "완료" }
    );
    if (!confirmed) return;
    setIsProcessing(true);
    try {
      await completeAdjustment(workspaceIdNum, adjustmentIdNum);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  if (detailStatus === "loading") {
    return <LoadingOverlay />;
  }

  if (!currentAdjustment) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="정산을 찾을 수 없습니다"
        description="요청하신 정산이 존재하지 않거나 접근 권한이 없습니다."
        action={
          <Button
            variant="outline"
            onClick={() => navigate(`/workspace/${workspaceIdNum}/adjustment`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로 돌아가기
          </Button>
        }
        className="min-h-[60vh]"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/workspace/${workspaceIdNum}/adjustment`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{currentAdjustment.name}</h1>
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
            <p className="text-muted-foreground">
              {formatDate(currentAdjustment.startDate)} ~{" "}
              {formatDate(currentAdjustment.endDate)}
            </p>
          </div>
        </div>
        {isCreator && !isCompleted && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isProcessing}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {isEditing ? "취소" : "수정"}
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isProcessing}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
            <Button onClick={handleComplete} disabled={isProcessing}>
              <CheckCircle className="h-4 w-4 mr-2" />
              완료 처리
            </Button>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>정산 수정</CardTitle>
          </CardHeader>
          <CardContent>
            <AdjustmentForm
              workspaceId={workspaceIdNum}
              adjustment={currentAdjustment}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {!isEditing && currentAdjustment.result && (
        <AdjustmentResultView result={currentAdjustment.result} />
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">정산 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">생성자</dt>
              <dd className="font-medium">
                {currentAdjustment.creator.nickname || "알 수 없음"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">생성일</dt>
              <dd className="font-medium">{formatDate(currentAdjustment.createdAt)}</dd>
            </div>
            {isCompleted && currentAdjustment.completedAt && (
              <div>
                <dt className="text-muted-foreground">완료일</dt>
                <dd className="font-medium">
                  {formatDate(currentAdjustment.completedAt)}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdjustmentDetailPage;
