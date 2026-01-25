import { singleton } from "tsyringe";
import { LogRepository } from "@api/features/log/log-repository";
import { MemberRepository } from "@api/features/workspace/member-repository";
import type { AdjustmentResult, TransferInfo, UserExpense } from "@repo/interfaces";
import { LogType, MemberStatus } from "@repo/interfaces";

interface CalculationParams {
  workspaceId: number;
  startDate: string;
  endDate: string;
  categoryIds: number[];
  methodIds: number[];
  participantIds: number[];
}

interface UserExpenseRaw {
  userId: number;
  nickname: string;
  totalExpense: number;
}

@singleton()
export class AdjustmentCalculator {
  constructor(
    private readonly logRepository: LogRepository,
    private readonly memberRepository: MemberRepository
  ) {}

  /**
   * 정산 결과 계산
   */
  async calculate(params: CalculationParams): Promise<AdjustmentResult> {
    const {
      workspaceId,
      startDate,
      endDate,
      categoryIds,
      methodIds,
      participantIds,
    } = params;

    // 1. 참여자 목록 결정
    const participants = await this.getParticipants(workspaceId, participantIds);

    if (participants.length === 0) {
      return {
        totalExpense: 0,
        perPersonAmount: 0,
        userExpenses: [],
        transfers: [],
      };
    }

    const participantUserIds = participants.map((p) => p.userId);

    // 2. 기간/카테고리/수단 필터로 EXPENSE 타입 Log 조회 (참여자별 합계)
    const userExpensesRaw = await this.calculateUserExpenses(
      workspaceId,
      startDate,
      endDate,
      categoryIds,
      methodIds,
      participantUserIds
    );

    // 3. 총 지출과 1인당 부담금 계산
    const totalExpense = userExpensesRaw.reduce(
      (sum, ue) => sum + ue.totalExpense,
      0
    );
    const perPersonAmount = Math.floor(totalExpense / participants.length);

    // 4. 개인별 차액 계산
    const userExpenses: UserExpense[] = participants.map((p) => {
      const expense = userExpensesRaw.find((ue) => ue.userId === p.userId);
      const totalExpenseValue = expense?.totalExpense ?? 0;
      const difference = totalExpenseValue - perPersonAmount;

      return {
        userId: p.userId,
        nickname: p.nickname ?? `사용자${p.userId}`,
        totalExpense: totalExpenseValue,
        shouldPay: perPersonAmount,
        difference,
      };
    });

    // 5. 최소 송금 횟수 알고리즘으로 송금 정보 계산
    const transfers = this.calculateMinimumTransfers(userExpenses);

    return {
      totalExpense,
      perPersonAmount,
      userExpenses,
      transfers,
    };
  }

  /**
   * 참여자 목록 조회
   * participantIds가 비어있으면 워크스페이스의 ACCEPTED 멤버 전체
   */
  private async getParticipants(
    workspaceId: number,
    participantIds: number[]
  ): Promise<Array<{ userId: number; nickname: string | null }>> {
    const members = await this.memberRepository.find({
      where: {
        workspaceId,
        status: MemberStatus.ACCEPTED,
      },
      relations: ["user"],
    });

    if (participantIds.length === 0) {
      return members.map((m) => ({
        userId: m.userId,
        nickname: m.user?.nickname ?? null,
      }));
    }

    return members
      .filter((m) => participantIds.includes(m.userId))
      .map((m) => ({
        userId: m.userId,
        nickname: m.user?.nickname ?? null,
      }));
  }

  /**
   * 참여자별 지출 합계 계산
   */
  private async calculateUserExpenses(
    workspaceId: number,
    startDate: string,
    endDate: string,
    categoryIds: number[],
    methodIds: number[],
    participantUserIds: number[]
  ): Promise<UserExpenseRaw[]> {
    const qb = this.logRepository
      .createQueryBuilder("log")
      .select("log.userId", "userId")
      .addSelect("user.nickname", "nickname")
      .addSelect("COALESCE(SUM(log.amount), 0)", "totalExpense")
      .innerJoin("log.user", "user")
      .where("log.workspaceId = :workspaceId", { workspaceId })
      .andWhere("log.type = :type", { type: LogType.EXPENSE })
      .andWhere("log.date >= :startDate", { startDate })
      .andWhere("log.date <= :endDate", { endDate })
      .andWhere("log.userId IN (:...userIds)", { userIds: participantUserIds })
      .groupBy("log.userId")
      .addGroupBy("user.nickname");

    // 카테고리 필터
    if (categoryIds.length > 0) {
      qb.andWhere("log.categoryId IN (:...categoryIds)", { categoryIds });
    }

    // 수단 필터
    if (methodIds.length > 0) {
      qb.andWhere("log.methodId IN (:...methodIds)", { methodIds });
    }

    const results = await qb.getRawMany<{
      userId: number;
      nickname: string | null;
      totalExpense: string;
    }>();

    return results.map((r) => ({
      userId: r.userId,
      nickname: r.nickname ?? `사용자${r.userId}`,
      totalExpense: parseFloat(r.totalExpense) || 0,
    }));
  }

  /**
   * 최소 송금 횟수 알고리즘 (Net Balancing / Greedy)
   * 채권자(+)와 채무자(-) 분리 후 Greedy 매칭
   */
  private calculateMinimumTransfers(userExpenses: UserExpense[]): TransferInfo[] {
    // 채권자 (돈 받을 사람, difference > 0)
    const creditors = userExpenses
      .filter((ue) => ue.difference > 0)
      .map((ue) => ({
        userId: ue.userId,
        nickname: ue.nickname,
        amount: ue.difference,
      }))
      .sort((a, b) => b.amount - a.amount); // 금액 기준 내림차순

    // 채무자 (돈 보낼 사람, difference < 0)
    const debtors = userExpenses
      .filter((ue) => ue.difference < 0)
      .map((ue) => ({
        userId: ue.userId,
        nickname: ue.nickname,
        amount: Math.abs(ue.difference), // 양수로 변환
      }))
      .sort((a, b) => b.amount - a.amount); // 금액 기준 내림차순

    const transfers: TransferInfo[] = [];

    let creditorIdx = 0;
    let debtorIdx = 0;

    while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
      const creditor = creditors[creditorIdx];
      const debtor = debtors[debtorIdx];

      const transferAmount = Math.min(creditor.amount, debtor.amount);

      if (transferAmount > 0) {
        transfers.push({
          fromUserId: debtor.userId,
          fromUserNickname: debtor.nickname,
          toUserId: creditor.userId,
          toUserNickname: creditor.nickname,
          amount: transferAmount,
        });
      }

      creditor.amount -= transferAmount;
      debtor.amount -= transferAmount;

      if (creditor.amount === 0) {
        creditorIdx++;
      }
      if (debtor.amount === 0) {
        debtorIdx++;
      }
    }

    return transfers;
  }
}
