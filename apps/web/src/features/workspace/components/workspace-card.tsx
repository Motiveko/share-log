import { Link } from "react-router";
import type { WorkspaceWithMemberCount } from "@repo/interfaces";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import { cn } from "@web/lib/utils";

interface WorkspaceCardProps {
  workspace: WorkspaceWithMemberCount;
  className?: string;
}

function WorkspaceCard({ workspace, className }: WorkspaceCardProps) {
  return (
    <Link to={`/workspace/${workspace.id}`}>
      <Card
        className={cn(
          "hover:border-primary/50 transition-colors cursor-pointer",
          className
        )}
      >
        <CardHeader className="pb-2">
          {workspace.thumbnailUrl && (
            <div className="w-full h-24 mb-2 rounded-md overflow-hidden bg-muted">
              <img
                src={workspace.thumbnailUrl}
                alt={workspace.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardTitle className="text-lg">{workspace.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {workspace.memberCount}명의 멤버
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default WorkspaceCard;
