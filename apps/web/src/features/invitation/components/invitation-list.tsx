import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";
import { Button } from "@web/components/ui/button";
import { Spinner } from "@web/components/ui/spinner";
import { useInvitationStore } from "@web/features/invitation/store";
import { useWorkspaceStore } from "@web/features/workspace/store";
import { toastService } from "@web/features/toast/toast-service";
import { useNavigate } from "react-router";
import { getErrorMessage } from "@web/lib/error";

export function InvitationList() {
  const navigate = useNavigate();
  const { invitations, status, fetchInvitations, acceptInvitation, rejectInvitation } =
    useInvitationStore();
  const { fetchWorkspaces } = useWorkspaceStore();
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleAccept = async (id: number, workspaceId: number) => {
    setProcessingId(id);
    try {
      await acceptInvitation(id);
      toastService.success("초대를 수락했습니다.");
      await fetchWorkspaces();
      navigate(`/workspace/${workspaceId}`);
    } catch (error) {
      toastService.error(getErrorMessage(error));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessingId(id);
    try {
      await rejectInvitation(id);
      toastService.success("초대를 거절했습니다.");
    } catch (error) {
      toastService.error(getErrorMessage(error));
    } finally {
      setProcessingId(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center py-4">
        <Spinner />
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">받은 초대</h2>
      {invitations.map((invitation) => (
        <Card key={invitation.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {invitation.workspace.name}
            </CardTitle>
            <CardDescription>
              {invitation.inviter.nickname || invitation.inviter.email}님이
              초대했습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAccept(invitation.id, invitation.workspaceId)}
                disabled={processingId === invitation.id}
              >
                {processingId === invitation.id ? "처리 중..." : "수락"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(invitation.id)}
                disabled={processingId === invitation.id}
              >
                거절
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
