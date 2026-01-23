import { useState, useEffect, useCallback } from "react";
import type { CreateWorkspaceDto, SearchUser } from "@repo/interfaces";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import { cn } from "@web/lib/utils";
import { API } from "@web/api";
import { X } from "lucide-react";

interface WorkspaceFormProps {
  onSubmit: (data: CreateWorkspaceDto) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

function WorkspaceForm({ onSubmit, isLoading, className }: WorkspaceFormProps) {
  const [name, setName] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [inviteeEmails, setInviteeEmails] = useState<string[]>([]);

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [directEmail, setDirectEmail] = useState("");

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await API.user.search(searchQuery);
        // 이미 추가된 이메일은 검색 결과에서 제외
        const filteredResults = results.filter(
          (user) => !inviteeEmails.includes(user.email)
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, inviteeEmails]);

  const handleSelectUser = useCallback((user: SearchUser) => {
    setInviteeEmails((prev) => {
      if (prev.includes(user.email)) return prev;
      return [...prev, user.email];
    });
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const handleAddDirectEmail = useCallback(() => {
    const email = directEmail.trim();
    if (!email) return;

    // 간단한 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return;

    if (!inviteeEmails.includes(email)) {
      setInviteeEmails((prev) => [...prev, email]);
    }
    setDirectEmail("");
  }, [directEmail, inviteeEmails]);

  const handleRemoveEmail = useCallback((email: string) => {
    setInviteeEmails((prev) => prev.filter((e) => e !== email));
  }, []);

  const handleDirectEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddDirectEmail();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      inviteeEmails: inviteeEmails.length > 0 ? inviteeEmails : undefined,
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

      {/* 멤버 초대 섹션 */}
      <div className="space-y-2">
        <Label>멤버 초대 (선택)</Label>

        {/* 사용자 검색 */}
        <div className="relative">
          <Input
            placeholder="이메일 또는 닉네임으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="max-h-32 overflow-y-auto rounded-md border">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className={cn(
                  "cursor-pointer p-2 hover:bg-accent transition-colors text-sm",
                  "border-b last:border-b-0"
                )}
                onClick={() => handleSelectUser(user)}
              >
                <p className="font-medium">{user.nickname || user.email}</p>
                {user.nickname && (
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 직접 이메일 입력 */}
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="이메일 직접 입력"
            value={directEmail}
            onChange={(e) => setDirectEmail(e.target.value)}
            onKeyDown={handleDirectEmailKeyDown}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddDirectEmail}
            disabled={!directEmail.trim()}
          >
            추가
          </Button>
        </div>

        {/* 선택된 이메일 목록 */}
        {inviteeEmails.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {inviteeEmails.map((email) => (
              <div
                key={email}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm"
              >
                <span className="max-w-[150px] truncate">{email}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(email)}
                  className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !name.trim()}>
        {isLoading ? "생성 중..." : "워크스페이스 생성"}
      </Button>
    </form>
  );
}

export default WorkspaceForm;
