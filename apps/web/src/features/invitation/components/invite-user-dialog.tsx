import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@web/components/ui/dialog";
import { Input } from "@web/components/ui/input";
import { Button } from "@web/components/ui/button";
import { API } from "@web/api";
import { cn } from "@web/lib/utils";
import { toast } from "react-toastify";
import type { SearchUser } from "@repo/interfaces";

interface InviteUserDialogProps {
  workspaceId: number;
  trigger: React.ReactNode;
  onInvited?: () => void;
}

export function InviteUserDialog({
  workspaceId,
  trigger,
  onInvited,
}: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

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
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectUser = useCallback((user: SearchUser) => {
    setSelectedEmail(user.email);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const handleInvite = async () => {
    if (!selectedEmail) return;

    setIsLoading(true);
    try {
      await API.invitation.create(workspaceId, { inviteeEmail: selectedEmail });
      toast.success("초대가 발송되었습니다.");
      setOpen(false);
      setSelectedEmail("");
      setSearchQuery("");
      onInvited?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "초대에 실패했습니다.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedEmail("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>멤버 초대</DialogTitle>
          <DialogDescription>
            이메일 또는 닉네임으로 사용자를 검색하여 초대하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-md border">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    "cursor-pointer p-3 hover:bg-accent transition-colors",
                    "border-b last:border-b-0"
                  )}
                  onClick={() => handleSelectUser(user)}
                >
                  <p className="font-medium">
                    {user.nickname || user.email}
                  </p>
                  {user.nickname && (
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Direct Email Input */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              또는 이메일 직접 입력
            </p>
            <Input
              type="email"
              placeholder="example@email.com"
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleInvite}
            disabled={!selectedEmail || isLoading}
          >
            {isLoading ? "초대 중..." : "초대하기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
