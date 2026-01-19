import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import { singleton } from "tsyringe";

export interface RequestContext {
  requestId: string;
  email?: string;
  userId?: number;
}

/**
 * AsyncLocalStorage를 활용한 Request Context 관리 클래스
 * HTTP 요청마다 고유한 requestId를 발급하고, 요청 처리 중 어디서든 접근 가능하게 함
 */
@singleton()
export class RequestContextStore {
  private storage = new AsyncLocalStorage<RequestContext>();

  /**
   * 새 요청 컨텍스트를 생성하고 콜백을 실행
   */
  run<T>(callback: () => T): T {
    const context: RequestContext = {
      requestId: randomUUID(),
    };
    return this.storage.run(context, callback);
  }

  /**
   * 특정 컨텍스트로 콜백을 실행 (테스트 등에서 사용)
   */
  runWith<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  /**
   * 현재 요청 컨텍스트를 반환
   */
  getContext(): RequestContext | undefined {
    return this.storage.getStore();
  }

  /**
   * 현재 요청 ID를 반환 (컨텍스트가 없으면 undefined)
   */
  getRequestId(): string | undefined {
    return this.storage.getStore()?.requestId;
  }

  /**
   * 현재 컨텍스트에 사용자 정보를 설정
   */
  setUser(user: { email?: string; userId?: number }): void {
    const context = this.storage.getStore();
    if (context) {
      if (user.email !== undefined) {
        context.email = user.email;
      }
      if (user.userId !== undefined) {
        context.userId = user.userId;
      }
    }
  }

  /**
   * 현재 사용자 이메일을 반환
   */
  getEmail(): string | undefined {
    return this.storage.getStore()?.email;
  }

  /**
   * 현재 사용자 ID를 반환
   */
  getUserId(): number | undefined {
    return this.storage.getStore()?.userId;
  }
}
