/**
 * 금액을 KRW 통화 형식으로 포맷
 * @example formatCurrency(10000) // "₩10,000"
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
};

/**
 * 날짜를 짧은 형식으로 포맷 (월, 일, 요일)
 * @example formatDateShort(new Date()) // "1월 15일 (수)"
 */
export const formatDateShort = (date: Date | string): string => {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(date));
};

/**
 * 날짜를 중간 형식으로 포맷 (연도, 월, 일 - 짧은 월)
 * @example formatDateMedium(new Date()) // "2024년 1월 15일"
 */
export const formatDateMedium = (date: Date | string): string => {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

/**
 * 날짜를 긴 형식으로 포맷 (연도, 월, 일 - 긴 월)
 * @example formatDateLong(new Date()) // "2024년 1월 15일"
 */
export const formatDateLong = (date: Date | string): string => {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
};

/**
 * 날짜 범위를 포맷
 * @example formatDateRange(startDate, endDate) // "2024년 1월 1일 ~ 2024년 1월 31일"
 */
export const formatDateRange = (
  startDate: Date | string,
  endDate: Date | string
): string => {
  return `${formatDateMedium(startDate)} ~ ${formatDateMedium(endDate)}`;
};

/**
 * 날짜를 input[type="date"]용 ISO 형식으로 변환
 * @example formatDateForInput(new Date()) // "2024-01-15"
 */
export const formatDateForInput = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};
