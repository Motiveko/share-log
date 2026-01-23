import { Link } from "react-router";
import { Button } from "@web/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { InvitationList } from "@web/features/invitation/components/invitation-list";

function WorkspaceEmptyPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>워크스페이스가 없습니다</CardTitle>
          <CardDescription>
            새로운 워크스페이스를 만들어 팀원들과 함께 작업을 시작하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link to="/workspace/new">워크스페이스 만들기</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="w-full max-w-md">
        <InvitationList />
      </div>
    </div>
  );
}

export default WorkspaceEmptyPage;
