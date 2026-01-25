import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@web/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import { useAdjustmentStore } from "@web/features/adjustment/store";
import { AdjustmentForm } from "@web/features/adjustment/components/adjustment-form";
import type { CreateAdjustmentDto, UpdateAdjustmentDto } from "@repo/interfaces";

function AdjustmentNewPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const workspaceIdNum = workspaceId ? parseInt(workspaceId, 10) : 0;

  const { createAdjustment } = useAdjustmentStore();

  const handleSubmit = async (data: CreateAdjustmentDto | UpdateAdjustmentDto) => {
    const adjustment = await createAdjustment(workspaceIdNum, data as CreateAdjustmentDto);
    navigate(`/workspace/${workspaceIdNum}/adjustment/${adjustment.id}`);
  };

  const handleCancel = () => {
    navigate(`/workspace/${workspaceIdNum}/adjustment`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/workspace/${workspaceIdNum}/adjustment`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">새 정산 만들기</h1>
          <p className="text-muted-foreground">정산 기간과 필터를 설정하세요</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>정산 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <AdjustmentForm
            workspaceId={workspaceIdNum}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default AdjustmentNewPage;
