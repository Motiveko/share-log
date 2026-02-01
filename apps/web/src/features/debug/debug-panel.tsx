import { useState } from "react";
import { Bug, X } from "lucide-react";
import { Button } from "@web/components/ui/button";
import { toastService } from "@web/features/toast/toast-service";

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <>
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Debug Panel"
      >
        <Bug className="h-5 w-5" />
      </button>

      {/* 디버그 패널 */}
      {isOpen && (
        <div className="fixed bottom-16 left-4 z-50 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-sm">Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 space-y-4">
            {/* Toast 테스트 섹션 */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                Toast
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toastService.success("성공 메시지입니다.")}
                >
                  Success
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toastService.error("에러 메시지입니다.")}
                >
                  Error
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toastService.warning("경고 메시지입니다.")}
                >
                  Warning
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toastService.info("안내 메시지입니다.")}
                >
                  Info
                </Button>
              </div>
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    toastService.success("액션이 있는 토스트", {
                      title: "성공",
                      action: {
                        label: "되돌리기",
                        onClick: () => toastService.info("되돌리기 클릭!"),
                      },
                    })
                  }
                >
                  With Action
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
