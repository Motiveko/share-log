import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, UserPlus } from "lucide-react";
import { MemberRole } from "@repo/interfaces";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@web/components/ui/dialog";
import { useWorkspaceStore } from "@web/features/workspace/store";
import { useAuthStore } from "@web/features/auth/store";
import { useInvitationStore } from "@web/features/invitation/store";
import { MemberManagementSection } from "@web/features/workspace-settings/components/member-management-section";
import { CategoryMethodSection } from "@web/features/workspace-settings/components/category-method-section";
import { NotificationSettingSection } from "@web/features/workspace-settings/components/notification-setting-section";

function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace, fetchWorkspace, members, fetchMembers, status } =
    useWorkspaceStore();
  const { user } = useAuthStore();
  const { createInvitation } = useInvitationStore();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const workspaceIdNum = workspaceId ? parseInt(workspaceId, 10) : 0;

  const isMaster = members.some(
    (m) => m.userId === user?.id && m.role === MemberRole.MASTER
  );

  useEffect(() => {
    if (workspaceIdNum) {
      void fetchWorkspace(workspaceIdNum);
      void fetchMembers(workspaceIdNum);
    }
  }, [workspaceIdNum, fetchWorkspace, fetchMembers]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      await createInvitation(workspaceIdNum, inviteEmail.trim());
      setInviteEmail("");
      setInviteDialogOpen(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "초대 전송에 실패했습니다.";
      setInviteError(message);
    } finally {
      setInviteLoading(false);
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to={`/workspace/${workspaceIdNum}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              돌아가기
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{currentWorkspace.name} 설정</h1>
            <p className="text-muted-foreground">
              워크스페이스 설정을 관리합니다.
            </p>
          </div>
        </div>

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              멤버 초대
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>멤버 초대</DialogTitle>
              <DialogDescription>
                이메일 주소로 새 멤버를 초대합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                type="email"
                placeholder="이메일 주소"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
              {inviteError && (
                <p className="text-sm text-destructive mt-2">{inviteError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
              >
                취소
              </Button>
              <Button onClick={handleInvite} disabled={inviteLoading}>
                {inviteLoading ? "초대 중..." : "초대"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        <MemberManagementSection
          workspaceId={workspaceIdNum}
          members={members}
          currentUserId={user?.id ?? 0}
          isMaster={isMaster}
        />

        <CategoryMethodSection
          workspaceId={workspaceIdNum}
          isMaster={isMaster}
        />

        <NotificationSettingSection workspaceId={workspaceIdNum} />
      </div>
    </div>
  );
}

export default WorkspaceSettingsPage;
