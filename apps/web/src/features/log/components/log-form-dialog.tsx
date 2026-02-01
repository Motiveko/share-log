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

const NONE_VALUE = "none";

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
  const [categoryId, setCategoryId] = useState<string>(NONE_VALUE);
  const [methodId, setMethodId] = useState<string>(NONE_VALUE);
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
      setCategoryId(log.categoryId ? String(log.categoryId) : NONE_VALUE);
      setMethodId(log.methodId ? String(log.methodId) : NONE_VALUE);
    } else {
      setType(LogType.EXPENSE);
      setAmount("");
      setDate(formatDateForInput(new Date()));
      setMemo("");
      setCategoryId(NONE_VALUE);
      setMethodId(NONE_VALUE);
    }
  }, [log, open]);

  const handleSubmit = async () => {
    if (!amount || !date) return;

    setIsSubmitting(true);
    try {
      const data: CreateLogDto | UpdateLogDto = {
        type,
        amount: Number(amount.replace(/,/g, "")),
        date,
        memo: memo || undefined,
        categoryId: categoryId !== NONE_VALUE ? Number(categoryId) : null,
        methodId: methodId !== NONE_VALUE ? Number(methodId) : null,
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
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>선택 안함</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>수단</Label>
            <Select value={methodId} onValueChange={setMethodId}>
              <SelectTrigger>
                <SelectValue placeholder="수단 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>선택 안함</SelectItem>
                {methods.map((method) => (
                  <SelectItem key={method.id} value={String(method.id)}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
