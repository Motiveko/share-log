import { useState, useEffect } from "react";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import { DatePicker } from "@web/components/ui/date-picker";
import { useCategoryStore } from "@web/features/category/store";
import { useMethodStore } from "@web/features/method/store";
import { useWorkspaceStore } from "@web/features/workspace/store";
import { formatDateForInput } from "@web/lib/format";
import type {
  AdjustmentWithCreator,
  CreateAdjustmentDto,
  UpdateAdjustmentDto,
} from "@repo/interfaces";

interface AdjustmentFormProps {
  workspaceId: number;
  adjustment?: AdjustmentWithCreator | null;
  onSubmit: (data: CreateAdjustmentDto | UpdateAdjustmentDto) => Promise<void>;
  onCancel?: () => void;
}

const getDefaultStartDate = (): string => {
  const date = new Date();
  date.setDate(1); // First day of current month
  return formatDateForInput(date);
};

const getDefaultEndDate = (): string => {
  return formatDateForInput(new Date());
};

export function AdjustmentForm({
  workspaceId,
  adjustment,
  onSubmit,
  onCancel,
}: AdjustmentFormProps) {
  const { categories, fetchCategories } = useCategoryStore();
  const { methods, fetchMethods } = useMethodStore();
  const { members, fetchMembers } = useWorkspaceStore();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedMethodIds, setSelectedMethodIds] = useState<number[]>([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!adjustment;

  useEffect(() => {
    void fetchCategories(workspaceId);
    void fetchMethods(workspaceId);
    void fetchMembers(workspaceId);
  }, [workspaceId, fetchCategories, fetchMethods, fetchMembers]);

  useEffect(() => {
    if (adjustment) {
      setName(adjustment.name);
      setStartDate(formatDateForInput(adjustment.startDate));
      setEndDate(formatDateForInput(adjustment.endDate));
      setSelectedCategoryIds(adjustment.categoryIds ?? []);
      setSelectedMethodIds(adjustment.methodIds ?? []);
      setSelectedParticipantIds(adjustment.participantIds ?? []);
    } else {
      setName("");
      setStartDate(getDefaultStartDate());
      setEndDate(getDefaultEndDate());
      setSelectedCategoryIds([]);
      setSelectedMethodIds([]);
      setSelectedParticipantIds([]);
    }
  }, [adjustment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return;

    setIsSubmitting(true);
    try {
      const data: CreateAdjustmentDto | UpdateAdjustmentDto = {
        name,
        startDate,
        endDate,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        methodIds: selectedMethodIds.length > 0 ? selectedMethodIds : undefined,
        participantIds: selectedParticipantIds.length > 0 ? selectedParticipantIds : undefined,
      };
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleMethod = (methodId: number) => {
    setSelectedMethodIds((prev) =>
      prev.includes(methodId)
        ? prev.filter((id) => id !== methodId)
        : [...prev, methodId]
    );
  };

  const toggleParticipant = (userId: number) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">정산 이름</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 1월 공동경비 정산"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>시작일</Label>
          <DatePicker value={startDate} onChange={setStartDate} />
        </div>
        <div className="space-y-2">
          <Label>종료일</Label>
          <DatePicker value={endDate} onChange={setEndDate} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>카테고리 필터 (선택하지 않으면 전체)</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.id)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                selectedCategoryIds.includes(category.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-border"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>수단 필터 (선택하지 않으면 전체)</Label>
        <div className="flex flex-wrap gap-2">
          {methods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => toggleMethod(method.id)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                selectedMethodIds.includes(method.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-border"
              }`}
            >
              {method.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>참여자 (선택하지 않으면 전체 멤버)</Label>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <button
              key={member.userId}
              type="button"
              onClick={() => toggleParticipant(member.userId)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                selectedParticipantIds.includes(member.userId)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-border"
              }`}
            >
              {member.user.nickname || member.user.email}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !name || !startDate || !endDate}>
          {isSubmitting ? "저장 중..." : isEditMode ? "수정" : "생성"}
        </Button>
      </div>
    </form>
  );
}
