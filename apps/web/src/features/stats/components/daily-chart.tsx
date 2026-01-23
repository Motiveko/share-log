import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import type { DailyStat } from "@repo/interfaces";

interface DailyChartProps {
  data: DailyStat[];
}

const formatCurrency = (value: number): string => {
  if (value >= 10000) {
    return `${Math.round(value / 10000)}만`;
  }
  return `${Math.round(value / 1000)}천`;
};

const formatDate = (date: string): string => {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export function DailyChart({ data }: DailyChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>일자별 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>일자별 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatDate} fontSize={12} />
            <YAxis tickFormatter={formatCurrency} fontSize={12} />
            <Tooltip
              formatter={(value) =>
                new Intl.NumberFormat("ko-KR").format(Number(value)) + "원"
              }
              labelFormatter={(label) => `날짜: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="expense"
              name="지출"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="income"
              name="수입"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
