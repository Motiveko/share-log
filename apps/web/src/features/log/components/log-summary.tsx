import { Card, CardContent } from "@web/components/ui/card";
import type { StatsSummary } from "@repo/interfaces";

interface LogSummaryProps {
  summary: StatsSummary;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
};

export function LogSummary({ summary }: LogSummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">총 지출</p>
          <p className="text-xl font-bold text-red-500">
            {formatCurrency(summary.totalExpense)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">총 수입</p>
          <p className="text-xl font-bold text-green-500">
            {formatCurrency(summary.totalIncome)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">잔액</p>
          <p
            className={`text-xl font-bold ${
              summary.balance >= 0 ? "text-blue-500" : "text-red-500"
            }`}
          >
            {formatCurrency(summary.balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
