import { Link, useParams } from "react-router";
import { useEffect } from "react";
import { Inbox } from "lucide-react";
import { useWorkspaceStore } from "@web/features/workspace/store";
import { cn } from "@web/lib/utils";
import { Button } from "@web/components/ui/button";
import { Loading } from "@web/components/ui/loading";
import { EmptyState } from "@web/components/ui/empty-state";

function Lnb() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces, fetchWorkspaces, status } = useWorkspaceStore();

  useEffect(() => {
    if (status === "idle") {
      void fetchWorkspaces();
    }
  }, [status, fetchWorkspaces]);

  const currentWorkspaceId = workspaceId ? parseInt(workspaceId, 10) : null;

  return (
    <aside className="w-64 border-r bg-muted/30 flex flex-col shrink-0">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">워크스페이스</h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {status === "loading" && (
          <Loading message="로딩 중..." className="py-8" />
        )}

        {status === "success" && workspaces.length === 0 && (
          <EmptyState
            icon={Inbox}
            title="워크스페이스가 없습니다"
            className="py-8"
          />
        )}

        <ul className="space-y-1">
          {workspaces.map((ws) => (
            <li key={ws.id}>
              <Link
                to={`/workspace/${ws.id}`}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  currentWorkspaceId === ws.id && "bg-accent text-accent-foreground"
                )}
              >
                <span className="truncate block">{ws.name}</span>
                <span className="text-xs text-muted-foreground">
                  {ws.memberCount}명
                </span>
              </Link>
              {currentWorkspaceId === ws.id && (
                <ul className="ml-4 mt-1 space-y-1">
                  <li>
                    <Link
                      to={`/workspace/${ws.id}/adjustment`}
                      className="block px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      정산
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={`/workspace/${ws.id}/settings`}
                      className="block px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      설정
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <Button asChild variant="outline" className="w-full">
          <Link to="/workspace/new">새 워크스페이스</Link>
        </Button>
      </div>
    </aside>
  );
}

export default Lnb;
