import { ERROR_CODES, type ErrorCode, type ApiErrorResponse } from "@repo/interfaces";
import { HttpError } from "@web/errors/http";

/**
 * 에러 코드별 사용자 친화적 메시지 매핑
 */
const ERROR_MESSAGE_MAP: Record<ErrorCode, string> = {
  // 공통 에러
  [ERROR_CODES.UNKNOWN_ERROR]: "알 수 없는 에러가 발생했습니다. 잠시 후 다시 시도해주세요.",
  [ERROR_CODES.VALIDATION_ERROR]: "입력값이 올바르지 않습니다.",
  [ERROR_CODES.NOT_FOUND]: "요청한 데이터를 찾을 수 없습니다.",
  [ERROR_CODES.UNAUTHORIZED]: "로그인이 필요합니다.",
  [ERROR_CODES.FORBIDDEN]: "접근 권한이 없습니다.",

  // 초대 관련
  [ERROR_CODES.ALREADY_MEMBER]: "이미 워크스페이스 멤버입니다.",
  [ERROR_CODES.ALREADY_INVITED]: "이미 초대가 진행 중입니다.",
  [ERROR_CODES.CANNOT_INVITE_SELF]: "자기 자신을 초대할 수 없습니다.",
  [ERROR_CODES.INVITATION_NOT_FOUND]: "초대를 찾을 수 없습니다.",
  [ERROR_CODES.INVITATION_ALREADY_PROCESSED]: "이미 처리된 초대입니다.",
  [ERROR_CODES.NOT_YOUR_INVITATION]: "본인의 초대만 처리할 수 있습니다.",
  [ERROR_CODES.CANNOT_CANCEL_INVITATION]: "초대를 취소할 권한이 없습니다.",

  // 워크스페이스 관련
  [ERROR_CODES.WORKSPACE_NOT_FOUND]: "워크스페이스를 찾을 수 없습니다.",
  [ERROR_CODES.MEMBER_NOT_FOUND]: "멤버를 찾을 수 없습니다.",
  [ERROR_CODES.LAST_MASTER_CANNOT_LEAVE]: "워크스페이스에는 최소 1명의 관리자가 필요합니다.",
  [ERROR_CODES.CANNOT_EXPEL_SELF]: "자기 자신을 추방할 수 없습니다.",

  // 카테고리/수단 관련
  [ERROR_CODES.DUPLICATE_CATEGORY_NAME]: "이미 동일한 이름의 카테고리가 존재합니다.",
  [ERROR_CODES.CATEGORY_NOT_FOUND]: "카테고리를 찾을 수 없습니다.",
  [ERROR_CODES.DUPLICATE_METHOD_NAME]: "이미 동일한 이름의 결제 수단이 존재합니다.",
  [ERROR_CODES.METHOD_NOT_FOUND]: "결제 수단을 찾을 수 없습니다.",
  [ERROR_CODES.CANNOT_DELETE_DEFAULT_METHOD]: "기본 결제 수단은 삭제할 수 없습니다.",

  // 정산 관련
  [ERROR_CODES.ADJUSTMENT_NOT_FOUND]: "정산을 찾을 수 없습니다.",
  [ERROR_CODES.ADJUSTMENT_ALREADY_COMPLETED]: "이미 완료된 정산입니다.",
  [ERROR_CODES.CANNOT_MODIFY_COMPLETED_ADJUSTMENT]: "완료된 정산은 수정할 수 없습니다.",
  [ERROR_CODES.INVALID_DATE_RANGE]: "시작일이 종료일보다 늦을 수 없습니다.",
  [ERROR_CODES.NOT_ADJUSTMENT_CREATOR]: "본인이 생성한 정산만 수정/삭제할 수 있습니다.",

  // 로그 관련
  [ERROR_CODES.LOG_NOT_FOUND]: "기록을 찾을 수 없습니다.",
  [ERROR_CODES.NOT_LOG_CREATOR]: "본인이 작성한 기록만 수정/삭제할 수 있습니다.",

  // 사용자 관련
  [ERROR_CODES.USER_NOT_FOUND]: "사용자를 찾을 수 없습니다.",
  [ERROR_CODES.DUPLICATE_DATA]: "이미 존재하는 데이터입니다.",

  // 알림 관련
  [ERROR_CODES.NOTIFICATION_NOT_FOUND]: "알림을 찾을 수 없습니다.",
};

/**
 * 에러 응답에서 에러 코드를 추출합니다.
 */
export function getErrorCode(error: unknown): ErrorCode | undefined {
  if (error instanceof HttpError && error.data) {
    const data = error.data as ApiErrorResponse;
    return data.code;
  }
  return undefined;
}

/**
 * 에러 응답에서 서버 메시지를 추출합니다.
 */
export function getServerMessage(error: unknown): string | undefined {
  if (error instanceof HttpError && error.data) {
    const data = error.data as ApiErrorResponse;
    return data.error;
  }
  return undefined;
}

/**
 * 에러 객체에서 사용자에게 노출할 메시지를 추출합니다.
 * 에러 코드가 있으면 매핑된 메시지를, 없으면 서버 메시지나 기본 메시지를 반환합니다.
 */
export function getErrorMessage(error: unknown): string {
  // 에러 코드가 있으면 매핑된 메시지 사용
  const errorCode = getErrorCode(error);
  if (errorCode && ERROR_MESSAGE_MAP[errorCode]) {
    return ERROR_MESSAGE_MAP[errorCode];
  }

  // 서버에서 보낸 메시지가 있으면 사용
  const serverMessage = getServerMessage(error);
  if (serverMessage) {
    return serverMessage;
  }

  // Error 인스턴스의 메시지 사용
  if (error instanceof Error) {
    return error.message;
  }

  // 기본 메시지
  return ERROR_MESSAGE_MAP[ERROR_CODES.UNKNOWN_ERROR];
}

/**
 * 특정 에러 코드인지 확인합니다.
 */
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return getErrorCode(error) === code;
}
