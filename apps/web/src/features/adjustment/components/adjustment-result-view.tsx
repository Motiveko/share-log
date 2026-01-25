import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import type { AdjustmentResult } from "@repo/interfaces";

interface AdjustmentResultViewProps {
  result: AdjustmentResult;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
};

export function AdjustmentResultView({ result }: AdjustmentResultViewProps) {
  const { totalExpense, perPersonAmount, userExpenses, transfers } = result;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">정산 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">총 지출</div>
              <div className="text-2xl font-bold">{formatCurrency(totalExpense)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">1인당 부담금</div>
              <div className="text-2xl font-bold">{formatCurrency(perPersonAmount)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">개인별 지출 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userExpenses.map((expense) => (
              <div
                key={expense.userId}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <div className="font-medium">{expense.nickname}</div>
                  <div className="text-sm text-muted-foreground">
                    실제 지출: {formatCurrency(expense.totalExpense)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    부담금: {formatCurrency(expense.shouldPay)}
                  </div>
                  <div
                    className={`font-semibold ${
                      expense.difference > 0
                        ? "text-green-600"
                        : expense.difference < 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {expense.difference > 0
                      ? `+${formatCurrency(expense.difference)} 받을 금액`
                      : expense.difference < 0
                      ? `${formatCurrency(expense.difference)} 보낼 금액`
                      : "정산 완료"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transfers */}
      {transfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">송금 안내</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transfers.map((transfer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border bg-background"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-20 text-center">
                      <div className="font-medium text-red-600">
                        {transfer.fromUserNickname}
                      </div>
                      <div className="text-xs text-muted-foreground">보내는 분</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div className="font-bold text-lg">
                        {formatCurrency(transfer.amount)}
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="w-20 text-center">
                      <div className="font-medium text-green-600">
                        {transfer.toUserNickname}
                      </div>
                      <div className="text-xs text-muted-foreground">받는 분</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {transfers.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                정산이 완료되었습니다. 송금이 필요하지 않습니다.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {transfers.length === 0 && userExpenses.length > 0 && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center text-muted-foreground">
              모든 참여자의 지출이 동일하여 정산이 필요하지 않습니다.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
