import dayjs from "dayjs";

export function startTimer() {
  const startTime = dayjs();

  return function getExecutionTime() {
    const endTime = dayjs();
    const duration = endTime.diff(startTime, "millisecond");
    return duration;
  };
}
