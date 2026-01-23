import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@web/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import type { UserStat } from "@repo/interfaces";

interface UserStatsTableProps {
  data: UserStat[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
};

export function UserStatsTable({ data }: UserStatsTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>사용자별 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>사용자별 통계</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>사용자</TableHead>
              <TableHead className="text-right">지출</TableHead>
              <TableHead className="text-right">수입</TableHead>
              <TableHead className="text-right">건수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((user) => (
              <TableRow key={user.userId}>
                <TableCell className="flex items-center gap-2">
                  {user.avatarUrl && (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span>{user.nickname || "알 수 없음"}</span>
                </TableCell>
                <TableCell className="text-right text-red-500">
                  {formatCurrency(user.expense)}
                </TableCell>
                <TableCell className="text-right text-green-500">
                  {formatCurrency(user.income)}
                </TableCell>
                <TableCell className="text-right">{user.count}건</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
