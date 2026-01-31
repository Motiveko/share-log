import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, UserPlus, AlertCircle } from "lucide-react";
import { MemberRole } from "@repo/interfaces";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { LoadingOverlay } from "@web/components/ui/loading";
import { EmptyState } from "@web/components/ui/empty-state";
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
import { useCreateInvitation } from "@web/features/invitation/hooks";
import { MemberManagementSection } from "@web/features/workspace-settings/components/member-management-section";
import { PendingInvitationsSection } from "@web/features/workspace-settings/components/pending-invitations-section";
import { CategoryMethodSection } from "@web/features/workspace-settings/components/category-method-section";
import { NotificationSettingSection } from "@web/features/workspace-settings/components/notification-setting-section";
import { getErrorMessage } from "@web/lib/error";

function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace, fetchWorkspace, members, fetchMembers, status } =
    useWorkspaceStore();
  const { user } = useAuthStore();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);

  const workspaceIdNum = workspaceId ? parseInt(workspaceId, 10) : 0;

  const createInvitationMutation = useCreateInvitation(workspaceIdNum);

  const isMaster = members.some(
    (m) => m.userId === user?.id && m.role === MemberRole.MASTER
  );

  useEffect(() => {
    if (workspaceIdNum) {
      void fetchWorkspace(workspaceIdNum);
      void fetchMembers(workspaceIdNum);
    }
  }, [workspaceIdNum, fetchWorkspace, fetchMembers]);

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;

    setInviteError(null);
    createInvitationMutation.mutate(inviteEmail.trim(), {
      onSuccess: () => {
        setInviteEmail("");
        setInviteDialogOpen(false);
      },
      onError: (error: unknown) => {
        setInviteError(getErrorMessage(error));
      },
    });
  };

  if (status === "loading") {
    return <LoadingOverlay />;
  }

  if (!currentWorkspace) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="워크스페이스를 찾을 수 없습니다"
        description="요청하신 워크스페이스가 존재하지 않거나 접근 권한이 없습니다."
        className="min-h-[60vh]"
      />
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
              <Button onClick={handleInvite} disabled={createInvitationMutation.isPending}>
                {createInvitationMutation.isPending ? "초대 중..." : "초대"}
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

        <PendingInvitationsSection
          workspaceId={workspaceIdNum}
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
