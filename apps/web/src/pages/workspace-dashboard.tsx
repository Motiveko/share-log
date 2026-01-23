import { useEffect } from "react";
import { useParams } from "react-router";
import { useWorkspaceStore } from "@web/features/workspace/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";

function WorkspaceDashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace, fetchWorkspace, status } = useWorkspaceStore();

  useEffect(() => {
    if (workspaceId) {
      void fetchWorkspace(parseInt(workspaceId, 10));
    }
  }, [workspaceId, fetchWorkspace]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">워크스페이스를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{currentWorkspace.name}</h1>
        <p className="text-muted-foreground">{currentWorkspace.memberCount}명의 멤버</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>워크스페이스 대시보드</CardTitle>
          <CardDescription>
            워크스페이스 대시보드입니다. Phase 6에서 추가 기능이 구현될 예정입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            이 워크스페이스에서 팀원들과 함께 작업하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default WorkspaceDashboardPage;
