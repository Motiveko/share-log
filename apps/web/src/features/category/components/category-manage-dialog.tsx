import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Palette } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@web/components/ui/popover";
import { ColorPicker } from "@web/components/ui/color-picker";
import { CategoryBadge } from "@web/features/category/components/category-badge";
import { useCategoryStore } from "@web/features/category/store";
import type { LogCategory } from "@repo/interfaces";
import { modalService } from "@web/features/modal";

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
  const [newColor, setNewColor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState<string | null>(null);
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
      await createCategory(workspaceId, {
        name: newName.trim(),
        ...(newColor && { color: newColor }),
      });
      setNewName("");
      setNewColor(null);
    } catch (error) {
      addToast({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (category: LogCategory) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingColor(category.color ?? null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    setIsSubmitting(true);
    try {
      const editingCategory = categories.find((c) => c.id === editingId);
      const colorChanged = editingColor !== (editingCategory?.color ?? null);
      await updateCategory(workspaceId, editingId, {
        name: editingName.trim(),
        ...(colorChanged && { color: editingColor }),
      });
      setEditingId(null);
      setEditingName("");
      setEditingColor(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingColor(null);
  };

  const handleDelete = async (categoryId: number) => {
    const confirmed = await modalService.destructive("정말 삭제하시겠습니까?");
    if (!confirmed) return;
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  {newColor ? (
                    <div
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: newColor }}
                    />
                  ) : (
                    <Palette className="h-4 w-4" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto">
                <ColorPicker value={newColor} onChange={setNewColor} />
              </PopoverContent>
            </Popover>
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
                  <div className="flex gap-2 flex-1 items-center">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0 h-8 w-8">
                          {editingColor ? (
                            <div
                              className="w-4 h-4 rounded-sm"
                              style={{ backgroundColor: editingColor }}
                            />
                          ) : (
                            <Palette className="h-4 w-4" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto">
                        <ColorPicker value={editingColor} onChange={setEditingColor} />
                      </PopoverContent>
                    </Popover>
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
                    <CategoryBadge name={category.name} color={category.color} />
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
