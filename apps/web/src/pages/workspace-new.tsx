import { useState } from "react";
import { useNavigate } from "react-router";
import type { CreateWorkspaceDto } from "@repo/interfaces";
import { API } from "@web/api";
import { useWorkspaceStore } from "@web/features/workspace/store";
import WorkspaceForm from "@web/features/workspace/components/workspace-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { logger } from "@web/lib/logger";
import { addToast } from "@web/features/toast/toast-service";

function WorkspaceNewPage() {
  const navigate = useNavigate();
  const { fetchWorkspaces } = useWorkspaceStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateWorkspaceDto) => {
    try {
      setIsLoading(true);
      const workspace = await API.workspace.create(data);
      await fetchWorkspaces();
      addToast({ message: "워크스페이스가 생성되었습니다.", type: "success" });
      navigate(`/workspace/${workspace.id}`);
    } catch (error) {
      logger.error(error);
      addToast({ message: "워크스페이스 생성에 실패했습니다.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>새 워크스페이스 만들기</CardTitle>
          <CardDescription>
            팀원들과 함께 작업할 새로운 워크스페이스를 만드세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceForm onSubmit={handleSubmit} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}

export default WorkspaceNewPage;
