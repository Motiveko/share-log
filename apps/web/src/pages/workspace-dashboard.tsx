import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import { Plus, Settings, AlertCircle } from "lucide-react";
import { Button } from "@web/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@web/components/ui/dropdown-menu";
import { LoadingOverlay } from "@web/components/ui/loading";
import { EmptyState } from "@web/components/ui/empty-state";
import { useWorkspaceStore } from "@web/features/workspace/store";
import { useLogStore } from "@web/features/log/store";
import { useStatsStore } from "@web/features/stats/store";
import { useAuthStore } from "@web/features/auth/store";
import { LogSummary } from "@web/features/log/components/log-summary";
import { LogFilter } from "@web/features/log/components/log-filter";
import { LogList } from "@web/features/log/components/log-list";
import { LogFormDialog } from "@web/features/log/components/log-form-dialog";
import { DailyChart } from "@web/features/stats/components/daily-chart";
import { MethodChart } from "@web/features/stats/components/method-chart";
import { CategoryChart } from "@web/features/stats/components/category-chart";
import { UserStatsTable } from "@web/features/stats/components/user-stats-table";
import { CategoryManageDialog } from "@web/features/category/components/category-manage-dialog";
import { MethodManageDialog } from "@web/features/method/components/method-manage-dialog";
import { MemberRole, type LogWithRelations, type LogListQuery, type CreateLogDto, type UpdateLogDto } from "@repo/interfaces";
import { modalService } from "@web/features/modal";

function WorkspaceDashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace, fetchWorkspace, members, fetchMembers, currentWorkspaceStatus } = useWorkspaceStore();
  const { createLog, updateLog, deleteLog, fetchLogs, filter } = useLogStore();
  const { fetchStats, summary, dailyData, methodStats, categoryStats, userStats } = useStatsStore();
  const { user } = useAuthStore();

  const [logFormOpen, setLogFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<LogWithRelations | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [methodDialogOpen, setMethodDialogOpen] = useState(false);

  const workspaceIdNum = workspaceId ? parseInt(workspaceId, 10) : 0;

  const isMaster = members.some(
    (m) => m.userId === user?.id && m.role === MemberRole.MASTER
  );

  useEffect(() => {
    if (workspaceIdNum) {
      void fetchWorkspace(workspaceIdNum);
      void fetchMembers(workspaceIdNum);
      // fetchStats and fetchLogs are called by LogFilter's initial filter
    }
  }, [workspaceIdNum, fetchWorkspace, fetchMembers]);

  const handleFilterChange = useCallback(
    (newFilter: LogListQuery) => {
      void fetchLogs(workspaceIdNum, newFilter);
      void fetchStats(workspaceIdNum, newFilter);
    },
    [workspaceIdNum, fetchLogs, fetchStats]
  );

  const handleLogFormSubmit = async (data: CreateLogDto | UpdateLogDto) => {
    if (editingLog) {
      await updateLog(workspaceIdNum, editingLog.id, data as UpdateLogDto);
    } else {
      await createLog(workspaceIdNum, data as CreateLogDto);
    }
    setEditingLog(null);
    void fetchStats(workspaceIdNum, filter);
  };

  const handleEditLog = (log: LogWithRelations) => {
    setEditingLog(log);
    setLogFormOpen(true);
  };

  const handleDeleteLog = async (logId: number) => {
    const confirmed = await modalService.destructive("정말 삭제하시겠습니까?");
    if (!confirmed) return;
    await deleteLog(workspaceIdNum, logId);
    void fetchStats(workspaceIdNum, filter);
  };

  const handleOpenLogForm = () => {
    setEditingLog(null);
    setLogFormOpen(true);
  };

  if (currentWorkspaceStatus === "loading" && !currentWorkspace) {
    return <LoadingOverlay />;
  }

  if (!currentWorkspace) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="워크스페이스를 찾을 수 없습니다"
        description="요청하신 워크스페이스가 존재하지 않거나 접근 권한이 없습니다."
        className="min-h-[60vh]"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{currentWorkspace.name}</h1>
          <p className="text-muted-foreground">{currentWorkspace.memberCount}명의 멤버</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                설정
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setCategoryDialogOpen(true)}>
                카테고리 관리
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setMethodDialogOpen(true)}>
                결제 수단 관리
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleOpenLogForm}>
            <Plus className="h-4 w-4 mr-2" />
            기록 추가
          </Button>
        </div>
      </div>

      {/* Filter */}
      <LogFilter workspaceId={workspaceIdNum} onFilterChange={handleFilterChange} />

      {/* Summary */}
      <LogSummary summary={summary} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DailyChart data={dailyData} />
        <MethodChart data={methodStats} />
        <CategoryChart data={categoryStats} />
        <UserStatsTable data={userStats} />
      </div>

      {/* Log List */}
      <LogList
        workspaceId={workspaceIdNum}
        currentUserId={user?.id ?? 0}
        onEdit={handleEditLog}
        onDelete={handleDeleteLog}
      />

      {/* Dialogs */}
      <LogFormDialog
        open={logFormOpen}
        onOpenChange={setLogFormOpen}
        workspaceId={workspaceIdNum}
        log={editingLog}
        onSubmit={handleLogFormSubmit}
      />

      <CategoryManageDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        workspaceId={workspaceIdNum}
        isMaster={isMaster}
      />

      <MethodManageDialog
        open={methodDialogOpen}
        onOpenChange={setMethodDialogOpen}
        workspaceId={workspaceIdNum}
        isMaster={isMaster}
      />
    </div>
  );
}

export default WorkspaceDashboardPage;
