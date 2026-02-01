import { useState } from "react";
import { useNavigate } from "react-router";
import { Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@web/components/ui/dialog";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import { API } from "@web/api";
import { toastService } from "@web/features/toast/toast-service";
import { getErrorMessage } from "@web/lib/error";

interface DangerZoneSectionProps {
  workspaceId: number;
  workspaceName: string;
}

export function DangerZoneSection({
  workspaceId,
  workspaceName,
}: DangerZoneSectionProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const isConfirmValid = confirmName === workspaceName;

  const deleteMutation = useMutation({
    mutationFn: () => API.workspace.remove(workspaceId),
    onSuccess: () => {
      toastService.success("워크스페이스가 삭제되었습니다.");
      navigate("/");
    },
    onError: (error) => {
      toastService.error(getErrorMessage(error));
    },
  });

  const handleDelete = () => {
    if (!isConfirmValid) return;
    deleteMutation.mutate();
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setConfirmName("");
    }
    setDialogOpen(open);
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-xl text-destructive">위험 구역</CardTitle>
        <CardDescription>
          이 작업은 되돌릴 수 없습니다. 신중하게 진행해 주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">워크스페이스 삭제</p>
            <p className="text-sm text-muted-foreground">
              워크스페이스와 모든 데이터가 영구적으로 삭제됩니다.
            </p>
          </div>
          <Button variant="destructive" onClick={() => setDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            삭제
          </Button>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>워크스페이스 삭제</DialogTitle>
            <DialogDescription>
              이 작업은 되돌릴 수 없습니다. 워크스페이스의 모든 데이터(로그,
              정산, 카테고리 등)가 영구적으로 삭제됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-3 bg-destructive/10 rounded-md">
              <p className="text-sm text-destructive">
                삭제를 확인하려면 아래에 <strong>{workspaceName}</strong>을
                입력하세요.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-name">워크스페이스 이름</Label>
              <Input
                id="confirm-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={workspaceName}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={deleteMutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isConfirmValid || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
