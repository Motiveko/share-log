import { useState } from "react";
import type { CreateWorkspaceDto } from "@repo/interfaces";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import { cn } from "@web/lib/utils";

interface WorkspaceFormProps {
  onSubmit: (data: CreateWorkspaceDto) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

function WorkspaceForm({ onSubmit, isLoading, className }: WorkspaceFormProps) {
  const [name, setName] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      thumbnailUrl: thumbnailUrl.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="name">워크스페이스 이름</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="워크스페이스 이름을 입력하세요"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnailUrl">썸네일 URL (선택)</Label>
        <Input
          id="thumbnailUrl"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://example.com/image.png"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !name.trim()}>
        {isLoading ? "생성 중..." : "워크스페이스 생성"}
      </Button>
    </form>
  );
}

export default WorkspaceForm;
