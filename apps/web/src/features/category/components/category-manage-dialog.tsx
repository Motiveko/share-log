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
import { useCategoryStore } from "@web/features/category/store";
import type { LogCategory } from "@repo/interfaces";

interface CategoryManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: number;
  isMaster: boolean;
}

export function CategoryManageDialog({
  open,
  onOpenChange,
  workspaceId,
  isMaster,
}: CategoryManageDialogProps) {
  const { categories, fetchCategories, createCategory, updateCategory, deleteCategory } =
    useCategoryStore();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      void fetchCategories(workspaceId);
    }
  }, [open, workspaceId, fetchCategories]);

  const handleCreate = async () => {
    if (isSubmitting || !newName.trim()) return;
    setIsSubmitting(true);
    try {
      await createCategory(workspaceId, { name: newName.trim() });
      setNewName("");
    } catch (error) {
      addToast({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (category: LogCategory) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    setIsSubmitting(true);
    try {
      await updateCategory(workspaceId, editingId, { name: editingName.trim() });
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

  const handleDelete = async (categoryId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setIsSubmitting(true);
    try {
      await deleteCategory(workspaceId, categoryId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>카테고리 관리</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="새 카테고리 이름"
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
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                {editingId === category.id ? (
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
                    <span>{category.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isMaster && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(category.id)}
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
            {categories.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                등록된 카테고리가 없습니다.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
