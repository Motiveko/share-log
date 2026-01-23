import { ERROR_MESSAGES } from "@web/constants/messages";

/**
 * 에러 객체에서 사용자에게 노출할 메시지를 추출합니다.
 * 추후 에러 타입에 따라 다른 메시지를 반환하도록 확장할 수 있습니다.
 */
export function getErrorMessage(error: unknown): string {
  // TODO: HttpError, ValidationError 등 커스텀 에러 타입에 따른 메시지 처리 추가
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}
