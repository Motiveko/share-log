import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@web/components/ui/dialog";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@web/components/ui/select";
import { Combobox } from "@web/components/ui/combobox";
import { DatePicker } from "@web/components/ui/date-picker";
import { useCategoryStore } from "@web/features/category/store";
import { useMethodStore } from "@web/features/method/store";
import { formatDateForInput } from "@web/lib/format";
import type { LogWithRelations, CreateLogDto, UpdateLogDto } from "@repo/interfaces";
import { LogType } from "@repo/interfaces";

interface LogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: number;
  log?: LogWithRelations | null;
  onSubmit: (data: CreateLogDto | UpdateLogDto) => Promise<void>;
}

export function LogFormDialog({
  open,
  onOpenChange,
  workspaceId,
  log,
  onSubmit,
}: LogFormDialogProps) {
  const { categories, fetchCategories } = useCategoryStore();
  const { methods, fetchMethods } = useMethodStore();

  const [type, setType] = useState<LogType>(LogType.EXPENSE);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [memo, setMemo] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [methodId, setMethodId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!log;

  useEffect(() => {
    if (open) {
      void fetchCategories(workspaceId);
      void fetchMethods(workspaceId);
    }
  }, [open, workspaceId, fetchCategories, fetchMethods]);

  useEffect(() => {
    if (log) {
      setType(log.type);
      setAmount(log.amount.toLocaleString());
      setDate(formatDateForInput(log.date));
      setMemo(log.memo || "");
      setCategoryId(log.categoryId ? String(log.categoryId) : "");
      setMethodId(log.methodId ? String(log.methodId) : "");
    } else {
      setType(LogType.EXPENSE);
      setAmount("");
      setDate(formatDateForInput(new Date()));
      setMemo("");
      setCategoryId("");
      setMethodId("");
    }
  }, [log, open]);

  // 옵션이 로드되면 첫 번째 항목을 기본 선택
  useEffect(() => {
    if (!open) return;
    if (!categoryId && categories.length > 0) {
      setCategoryId(String(categories[0].id));
    }
  }, [open, categories, categoryId]);

  useEffect(() => {
    if (!open) return;
    if (!methodId && methods.length > 0) {
      setMethodId(String(methods[0].id));
    }
  }, [open, methods, methodId]);

  const handleSubmit = async () => {
    if (!amount || !date) return;

    setIsSubmitting(true);
    try {
      const data: CreateLogDto | UpdateLogDto = {
        type,
        amount: Number(amount.replace(/,/g, "")),
        date,
        memo: memo || undefined,
        categoryId: categoryId ? Number(categoryId) : null,
        methodId: methodId ? Number(methodId) : null,
      };
      await onSubmit(data);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "기록 수정" : "새 기록 추가"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>유형</Label>
            <Select value={type} onValueChange={(v) => setType(v as LogType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LogType.EXPENSE}>지출</SelectItem>
                <SelectItem value={LogType.INCOME}>수입</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>금액</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                if (raw === "" || /^\d+$/.test(raw)) {
                  setAmount(raw === "" ? "" : Number(raw).toLocaleString());
                }
              }}
              placeholder="금액을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label>날짜</Label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <div className="space-y-2">
            <Label>카테고리</Label>
            <Combobox
              options={categories.map((cat) => ({
                value: String(cat.id),
                label: cat.name,
              }))}
              value={categoryId}
              onValueChange={setCategoryId}
              placeholder="카테고리 선택"
            />
          </div>

          <div className="space-y-2">
            <Label>수단</Label>
            <Combobox
              options={methods.map((method) => ({
                value: String(method.id),
                label: method.name,
              }))}
              value={methodId}
              onValueChange={setMethodId}
              placeholder="수단 선택"
            />
          </div>

          <div className="space-y-2">
            <Label>메모</Label>
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모를 입력하세요 (선택)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !amount || !date}>
            {isSubmitting ? "저장 중..." : isEditMode ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
