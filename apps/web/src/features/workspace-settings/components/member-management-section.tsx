import { useState } from "react";
import { UserMinus, Shield, ShieldOff } from "lucide-react";
import { MemberRole, type WorkspaceMemberWithUser } from "@repo/interfaces";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@web/components/ui/select";
import { useWorkspaceStore } from "@web/features/workspace/store";
import { cn } from "@web/lib/utils";
import { modalService } from "@web/features/modal";

interface MemberManagementSectionProps {
  workspaceId: number;
  members: WorkspaceMemberWithUser[];
  currentUserId: number;
  isMaster: boolean;
}

export function MemberManagementSection({
  workspaceId,
  members,
  currentUserId,
  isMaster,
}: MemberManagementSectionProps) {
  const { updateMemberRole, expelMember } = useWorkspaceStore();
  const [loading, setLoading] = useState<number | null>(null);

  const handleRoleChange = async (userId: number, role: MemberRole) => {
    setLoading(userId);
    try {
      await updateMemberRole(workspaceId, userId, { role });
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleExpel = async (userId: number, nickname: string) => {
    const confirmed = await modalService.destructive(
      `정말 ${nickname}님을 추방하시겠습니까?`,
      { confirmText: "추방" }
    );
    if (!confirmed) return;
    setLoading(userId);
    try {
      await expelMember(workspaceId, userId);
    } catch (error) {
      console.error("Failed to expel member:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">멤버 관리</CardTitle>
        <CardDescription>
          워크스페이스 멤버를 관리하고 권한을 설정합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>멤버</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>권한</TableHead>
              {isMaster && <TableHead className="text-right">관리</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const isLoading = loading === member.userId;

              return (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {member.user.avatarUrl && (
                        <img
                          src={member.user.avatarUrl}
                          alt={member.user.nickname || ""}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span>{member.user.nickname || "이름 없음"}</span>
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground">(나)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.user.email}
                  </TableCell>
                  <TableCell>
                    {isMaster && !isCurrentUser ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(member.userId, value as MemberRole)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={MemberRole.MASTER}>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Master
                            </div>
                          </SelectItem>
                          <SelectItem value={MemberRole.MEMBER}>
                            <div className="flex items-center gap-2">
                              <ShieldOff className="h-4 w-4" />
                              Member
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm",
                          member.role === MemberRole.MASTER
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {member.role === MemberRole.MASTER ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <ShieldOff className="h-3 w-3" />
                        )}
                        {member.role === MemberRole.MASTER ? "Master" : "Member"}
                      </span>
                    )}
                  </TableCell>
                  {isMaster && (
                    <TableCell className="text-right">
                      {!isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleExpel(
                              member.userId,
                              member.user.nickname || "이름 없음"
                            )
                          }
                          disabled={isLoading}
                        >
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
