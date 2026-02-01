import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { addToast } from "@web/features/toast/toast-service";
import { getErrorMessage } from "@web/lib/error";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@web/components/ui/dialog";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { Badge } from "@web/components/ui/badge";
import { useMethodStore } from "@web/features/method/store";
import type { LogMethod } from "@repo/interfaces";
import { modalService } from "@web/features/modal";

interface MethodManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: number;
  isMaster: boolean;
}

export function MethodManageDialog({
  open,
  onOpenChange,
  workspaceId,
  isMaster,
}: MethodManageDialogProps) {
  const { methods, fetchMethods, createMethod, updateMethod, deleteMethod } =
    useMethodStore();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      void fetchMethods(workspaceId);
    }
  }, [open, workspaceId, fetchMethods]);

  const handleCreate = async () => {
    if (isSubmitting || !newName.trim()) return;
    setIsSubmitting(true);
    try {
      await createMethod(workspaceId, { name: newName.trim() });
      setNewName("");
    } catch (error) {
      addToast({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (method: LogMethod) => {
    setEditingId(method.id);
    setEditingName(method.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    setIsSubmitting(true);
    try {
      await updateMethod(workspaceId, editingId, { name: editingName.trim() });
      setEditingId(null);
      setEditingName("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async (methodId: number) => {
    const confirmed = await modalService.destructive("정말 삭제하시겠습니까?");
    if (!confirmed) return;
    setIsSubmitting(true);
    try {
      await deleteMethod(workspaceId, methodId);
    } catch (error) {
      addToast({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDefaultMethod = (method: LogMethod) => !!method.defaultType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>결제 수단 관리</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="새 수단 이름"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
            <Button onClick={handleCreate} disabled={isSubmitting || !newName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {methods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                {editingId === method.id ? (
                  <div className="flex gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSaveEdit} disabled={isSubmitting}>
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      취소
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span>{method.name}</span>
                      {isDefaultMethod(method) && (
                        <Badge variant="muted">기본</Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(method)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isMaster && !isDefaultMethod(method) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(method.id)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
            {methods.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                등록된 결제 수단이 없습니다.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
