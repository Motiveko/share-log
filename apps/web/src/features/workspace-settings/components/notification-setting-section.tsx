import { useEffect, useState } from "react";
import { Bell, MessageSquare } from "lucide-react";
import { NotificationType } from "@repo/interfaces";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";
import { Switch } from "@web/components/ui/switch";
import { Checkbox } from "@web/components/ui/checkbox";
import { Label } from "@web/components/ui/label";
import { useNotificationSettingStore } from "@web/features/notification-setting/store";
import { toastService } from "@web/features/toast/toast-service";
import { cn } from "@web/lib/utils";

interface NotificationSettingSectionProps {
  workspaceId: number;
}

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.LOG_CREATED]: "지출/수입 등록",
  [NotificationType.LOG_DELETED]: "지출/수입 삭제",
  [NotificationType.ADJUSTMENT_CREATED]: "정산 생성",
  [NotificationType.ADJUSTMENT_COMPLETED]: "정산 완료",
  [NotificationType.MEMBER_JOINED]: "멤버 참여",
  [NotificationType.MEMBER_LEFT]: "멤버 탈퇴",
  [NotificationType.ROLE_CHANGED]: "권한 변경",
  [NotificationType.WORKSPACE_DELETED]: "워크스페이스 삭제",
};

export function NotificationSettingSection({
  workspaceId,
}: NotificationSettingSectionProps) {
  const { setting, fetchSetting, updateSetting, status } =
    useNotificationSettingStore();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      void fetchSetting(workspaceId);
    }
  }, [workspaceId, fetchSetting]);

  const handleWebPushToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      await updateSetting(workspaceId, { webPushEnabled: checked });
      toastService.success(
        checked ? "웹 푸시 알림이 활성화되었습니다." : "웹 푸시 알림이 비활성화되었습니다."
      );
    } catch (error) {
      console.error("Failed to update web push setting:", error);
      toastService.error("웹 푸시 알림 설정 변경에 실패했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSlackToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      await updateSetting(workspaceId, { slackEnabled: checked });
      toastService.success(
        checked ? "Slack 알림이 활성화되었습니다." : "Slack 알림이 비활성화되었습니다."
      );
    } catch (error) {
      console.error("Failed to update slack setting:", error);
      toastService.error("Slack 알림 설정 변경에 실패했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTypeToggle = async (type: NotificationType, checked: boolean) => {
    if (!setting) return;

    setIsUpdating(true);
    try {
      const newTypes = checked
        ? [...setting.enabledTypes, type]
        : setting.enabledTypes.filter((t) => t !== type);

      await updateSetting(workspaceId, { enabledTypes: newTypes });
      toastService.success("알림 유형이 변경되었습니다.");
    } catch (error) {
      console.error("Failed to update notification types:", error);
      toastService.error("알림 유형 변경에 실패했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (status === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">알림 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (!setting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">알림 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">알림 설정을 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">알림 설정</CardTitle>
        <CardDescription>
          워크스페이스 이벤트에 대한 알림을 설정합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 알림 채널 */}
        <div className="space-y-4">
          <h4 className="font-medium">알림 채널</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="webPush" className="font-medium">
                    웹 푸시 알림
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    브라우저에서 푸시 알림을 받습니다.
                  </p>
                </div>
              </div>
              <Switch
                id="webPush"
                checked={setting.webPushEnabled}
                onCheckedChange={handleWebPushToggle}
                disabled={isUpdating}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="slack" className="font-medium">
                    Slack 알림
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    프로필에 설정된 Slack 웹훅으로 알림을 받습니다.
                  </p>
                </div>
              </div>
              <Switch
                id="slack"
                checked={setting.slackEnabled}
                onCheckedChange={handleSlackToggle}
                disabled={isUpdating}
              />
            </div>
          </div>
        </div>

        {/* 알림 유형 */}
        <div className="space-y-4">
          <h4 className="font-medium">알림 유형</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(NotificationType).map((type) => {
              const isChecked = setting.enabledTypes.includes(type);
              return (
                <div
                  key={type}
                  className={cn(
                    "flex items-center space-x-2 p-3 rounded-md border",
                    isChecked ? "border-primary/50 bg-primary/5" : "border-border"
                  )}
                >
                  <Checkbox
                    id={type}
                    checked={isChecked}
                    onCheckedChange={(checked: boolean) =>
                      handleTypeToggle(type, checked)
                    }
                    disabled={isUpdating}
                  />
                  <Label
                    htmlFor={type}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {NOTIFICATION_TYPE_LABELS[type]}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
