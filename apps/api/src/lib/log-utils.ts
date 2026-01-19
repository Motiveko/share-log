const MAX_LOG_LENGTH = 300;

/**
 * 로깅용 body를 truncate합니다.
 * 문자열 기준 300자를 초과하면 300자까지만 표시하고 총 용량을 표시합니다.
 */
export const truncateLogBody = (body: unknown): string | undefined => {
  if (body == null) {
    return undefined;
  }

  const str = typeof body === "string" ? body : JSON.stringify(body);
  const totalLength = str.length;

  if (totalLength <= MAX_LOG_LENGTH) {
    return str;
  }

  return `${str.slice(0, MAX_LOG_LENGTH)}... [truncated, total: ${totalLength} chars]`;
};
