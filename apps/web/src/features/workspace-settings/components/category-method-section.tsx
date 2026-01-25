import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@web/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";
import { CategoryManageDialog } from "@web/features/category/components/category-manage-dialog";
import { MethodManageDialog } from "@web/features/method/components/method-manage-dialog";

interface CategoryMethodSectionProps {
  workspaceId: number;
  isMaster: boolean;
}

export function CategoryMethodSection({
  workspaceId,
  isMaster,
}: CategoryMethodSectionProps) {
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [methodDialogOpen, setMethodDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">카테고리 / 결제수단 관리</CardTitle>
        <CardDescription>
          지출/수입 기록에 사용할 카테고리와 결제수단을 관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setCategoryDialogOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            카테고리 관리
          </Button>
          <Button
            variant="outline"
            onClick={() => setMethodDialogOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            결제수단 관리
          </Button>
        </div>

        <CategoryManageDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          workspaceId={workspaceId}
          isMaster={isMaster}
        />

        <MethodManageDialog
          open={methodDialogOpen}
          onOpenChange={setMethodDialogOpen}
          workspaceId={workspaceId}
          isMaster={isMaster}
        />
      </CardContent>
    </Card>
  );
}
