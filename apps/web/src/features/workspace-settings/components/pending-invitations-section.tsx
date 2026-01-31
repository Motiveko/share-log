import { useEffect, useState } from "react";
import { X, Mail, Clock } from "lucide-react";
import type { WorkspaceInvitation } from "@repo/interfaces";
import { Button } from "@web/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@web/components/ui/table";
import { EmptyState } from "@web/components/ui/empty-state";
import { Spinner } from "@web/components/ui/spinner";
import { API } from "@web/api";
import { getErrorMessage } from "@web/lib/error";

interface PendingInvitationsSectionProps {
  workspaceId: number;
  currentUserId: number;
  isMaster: boolean;
}

export function PendingInvitationsSection({
  workspaceId,
  currentUserId,
  isMaster,
}: PendingInvitationsSectionProps) {
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await API.invitation.listWorkspaceInvitations(workspaceId);
      setInvitations(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInvitations();
  }, [workspaceId]);

  const handleCancel = async (invitationId: number) => {
    if (!confirm("정말 이 초대를 취소하시겠습니까?")) return;

    setCancelLoading(invitationId);
    try {
      await API.invitation.cancel(workspaceId, invitationId);
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelLoading(null);
    }
  };

  const canCancel = (invitation: WorkspaceInvitation) => {
    return isMaster || invitation.inviterId === currentUserId;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">초대 중인 사용자</CardTitle>
        <CardDescription>
          아직 수락되지 않은 초대 목록입니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive text-center py-4">{error}</p>
        ) : invitations.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="초대 중인 사용자가 없습니다"
            description="새로운 멤버를 초대하려면 상단의 '멤버 초대' 버튼을 사용하세요."
            className="py-8"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이메일</TableHead>
                <TableHead>초대한 사람</TableHead>
                <TableHead>초대 일시</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{invitation.inviteeEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {invitation.inviter.avatarUrl && (
                        <img
                          src={invitation.inviter.avatarUrl}
                          alt={invitation.inviter.nickname || ""}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="text-muted-foreground">
                        {invitation.inviter.nickname ||
                          invitation.inviter.email}
                        {invitation.inviterId === currentUserId && (
                          <span className="text-xs ml-1">(나)</span>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-sm">
                        {formatDate(invitation.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {canCancel(invitation) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(invitation.id)}
                        disabled={cancelLoading === invitation.id}
                      >
                        {cancelLoading === invitation.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
