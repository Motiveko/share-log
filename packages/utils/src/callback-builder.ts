export type Next<T> = (arg: T) => void;

export type Operation = (arg: any, next: Next<any>) => void;

/** prev, next 값을 비교하는 함수 타입 */
export type Comparator<T> = (prev: T, next: T) => boolean;

/** pairwise에서 사용하는 쌍 타입 */
export type Pair<T> = { prev: T; curr: T };

export class CallbackBuilder<T> {
  // 연산자들을 저장할 배열
  private ops: Operation[] = [];

  // private constructor로 외부에서 new 호출 방지 (선택 사항)
  private constructor() {}

  // =================================================================
  // [Static Entry Points] 체이닝 시작점
  // =================================================================

  /** 초기 입력 타입을 지정하며 시작 (가장 권장) */
  static of<I>(): CallbackBuilder<I> {
    return new CallbackBuilder<I>();
  }

  // =================================================================
  // [Instance Methods] 체이닝 메서드
  // =================================================================

  /** 데이터 변환 */
  map<R>(fn: (arg: T) => R): CallbackBuilder<R> {
    this.ops.push((arg, next) => next(fn(arg)));
    // 타입을 변환하여 this를 반환 (Type Casting)
    return this as unknown as CallbackBuilder<R>;
  }

  /** 데이터 필터링 (false면 중단) */
  filter(fn: (arg: T) => boolean): CallbackBuilder<T> {
    this.ops.push((arg, next) => {
      if (fn(arg)) next(arg);
    });
    return this;
  }

  /** 지정된 시간(ms) 동안 최대 1번만 실행 */
  throttle(ms: number): CallbackBuilder<T> {
    let lastTime = 0;
    this.ops.push((arg, next) => {
      const now = Date.now();
      if (now - lastTime >= ms) {
        lastTime = now;
        next(arg);
      }
    });
    return this;
  }

  /** 마지막 호출 후 지정된 시간(ms)이 지나야 실행 */
  debounce(ms: number): CallbackBuilder<T> {
    let timer: any = null;
    this.ops.push((arg, next) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => next(arg), ms);
    });
    return this;
  }

  /** 부수 효과 실행 (로깅 등, 흐름에 영향 안 줌) */
  tap(fn: (arg: T) => void): CallbackBuilder<T> {
    this.ops.push((arg, next) => {
      fn(arg);
      next(arg);
    });
    return this;
  }

  // =================================================================
  // [비교 기반 필터링]
  // =================================================================

  /**
   * 이전 값과 현재 값을 비교하여 변경되었을 때만 다음으로 진행
   * @param comparator 비교 함수 (기본: Object.is). true를 반환하면 "같음"으로 판단하여 스킵
   * @example
   * CallbackBuilder.of<number>()
   *   .distinctUntilChanged()
   *   .build(console.log)
   * // 1, 1, 2, 2, 3 호출 시 -> 1, 2, 3만 출력
   *
   * @example
   * // 커스텀 비교 (소수점 1자리까지만 비교)
   * CallbackBuilder.of<{ percent: number }>()
   *   .distinctUntilChanged((prev, next) =>
   *     prev.percent.toFixed(1) === next.percent.toFixed(1)
   *   )
   *   .build(console.log)
   */
  distinctUntilChanged(comparator?: Comparator<T>): CallbackBuilder<T> {
    const UNSET = Symbol("UNSET");
    let prevValue: T | typeof UNSET = UNSET;
    const isEqual = comparator ?? Object.is;

    this.ops.push((arg, next) => {
      if (prevValue === UNSET || !isEqual(prevValue, arg)) {
        prevValue = arg;
        next(arg);
      }
    });
    return this;
  }

  /**
   * 특정 키를 기준으로 이전 값과 비교하여 변경 시에만 진행
   * @param keyFn 비교할 키를 추출하는 함수
   * @example
   * CallbackBuilder.of<{ id: number; name: string }>()
   *   .distinctUntilChangedBy(item => item.id)
   *   .build(console.log)
   */
  distinctUntilChangedBy<K>(keyFn: (arg: T) => K): CallbackBuilder<T> {
    return this.distinctUntilChanged((prev, next) =>
      Object.is(keyFn(prev), keyFn(next))
    );
  }

  /**
   * 이전 값과 현재 값을 쌍으로 묶어서 전달
   * 첫 번째 호출은 이전 값이 없으므로 스킵됨
   * @example
   * CallbackBuilder.of<number>()
   *   .pairwise()
   *   .build(({ prev, curr }) => console.log(`${prev} -> ${curr}`))
   * // 1, 2, 3 호출 시 -> "1 -> 2", "2 -> 3" 출력
   */
  pairwise(): CallbackBuilder<Pair<T>> {
    const UNSET = Symbol("UNSET");
    let prevValue: T | typeof UNSET = UNSET;

    this.ops.push((arg, next) => {
      if (prevValue !== UNSET) {
        next({ prev: prevValue, curr: arg });
      }
      prevValue = arg;
    });
    return this as unknown as CallbackBuilder<Pair<T>>;
  }

  // =================================================================
  // [횟수 제한]
  // =================================================================

  /**
   * 처음 N개만 실행하고 이후는 무시
   * @example
   * CallbackBuilder.of<number>()
   *   .take(3)
   *   .build(console.log)
   * // 1, 2, 3, 4, 5 호출 시 -> 1, 2, 3만 출력
   */
  take(count: number): CallbackBuilder<T> {
    let remaining = count;
    this.ops.push((arg, next) => {
      if (remaining > 0) {
        remaining--;
        next(arg);
      }
    });
    return this;
  }

  /**
   * 처음 N개를 건너뛰고 이후부터 실행
   * @example
   * CallbackBuilder.of<number>()
   *   .skip(2)
   *   .build(console.log)
   * // 1, 2, 3, 4 호출 시 -> 3, 4만 출력
   */
  skip(count: number): CallbackBuilder<T> {
    let remaining = count;
    this.ops.push((arg, next) => {
      if (remaining > 0) {
        remaining--;
      } else {
        next(arg);
      }
    });
    return this;
  }

  /**
   * 한 번만 실행 (take(1)과 동일)
   * @example
   * CallbackBuilder.of<Event>()
   *   .once()
   *   .build(handleEvent)
   */
  once(): CallbackBuilder<T> {
    return this.take(1);
  }

  // =================================================================
  // [시간 기반]
  // =================================================================

  /**
   * 지정된 시간만큼 지연 후 실행
   * @example
   * CallbackBuilder.of<string>()
   *   .delay(1000)
   *   .build(console.log)
   * // 1초 후에 출력
   */
  delay(ms: number): CallbackBuilder<T> {
    this.ops.push((arg, next) => {
      setTimeout(() => next(arg), ms);
    });
    return this;
  }

  /**
   * throttle과 비슷하지만 주기가 끝날 때 마지막 값을 방출
   * (throttle은 주기가 시작될 때 첫 번째 값을 방출)
   * @example
   * CallbackBuilder.of<MouseEvent>()
   *   .audit(100)
   *   .build(handleMouseMove)
   */
  audit(ms: number): CallbackBuilder<T> {
    let timer: any = null;
    let latestValue: T;

    this.ops.push((arg, next) => {
      latestValue = arg;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          next(latestValue);
        }, ms);
      }
    });
    return this;
  }

  /**
   * 지정된 시간 동안 값을 모아서 배열로 한 번에 전달
   * @example
   * CallbackBuilder.of<number>()
   *   .buffer(1000)
   *   .build(console.log)
   * // 1초 동안 1, 2, 3 호출 시 -> [1, 2, 3] 출력
   */
  buffer(ms: number): CallbackBuilder<T[]> {
    let timer: any = null;
    let buffered: T[] = [];

    this.ops.push((arg, next) => {
      buffered.push(arg);
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          const result = buffered;
          buffered = [];
          if (result.length > 0) {
            next(result);
          }
        }, ms);
      }
    });
    return this as CallbackBuilder<T[]>;
  }

  // =================================================================
  // [에러 처리]
  // =================================================================

  /**
   * 에러 발생 시 처리하고 체인 진행 여부 결정
   * @param handler 에러 핸들러. true 반환 시 에러를 무시하고 계속 진행
   * @example
   * CallbackBuilder.of<string>()
   *   .map(JSON.parse)
   *   .catchError((error, value) => {
   *     console.error('Parse failed:', error, value);
   *     return false; // 체인 중단
   *   })
   *   .build(console.log)
   */
  catchError(
    handler: (error: unknown, value: T) => boolean
  ): CallbackBuilder<T> {
    const lastOp = this.ops.pop();
    if (lastOp) {
      this.ops.push((arg, next) => {
        try {
          lastOp(arg, next);
        } catch (error) {
          if (handler(error, arg)) {
            next(arg);
          }
        }
      });
    }
    return this;
  }

  // =================================================================
  // [조건부 실행]
  // =================================================================

  /**
   * 조건이 true인 동안만 실행 (조건이 false가 되면 이후 모든 호출 무시)
   * @example
   * let isActive = true;
   * CallbackBuilder.of<Event>()
   *   .takeWhile(() => isActive)
   *   .build(handleEvent)
   * // isActive가 false가 되면 더 이상 handleEvent 호출 안됨
   */
  takeWhile(predicate: (arg: T) => boolean): CallbackBuilder<T> {
    let stopped = false;
    this.ops.push((arg, next) => {
      if (stopped) return;
      if (predicate(arg)) {
        next(arg);
      } else {
        stopped = true;
      }
    });
    return this;
  }

  /**
   * 조건이 true가 될 때까지 스킵하고 이후부터 실행
   * @example
   * CallbackBuilder.of<number>()
   *   .skipWhile(n => n < 3)
   *   .build(console.log)
   * // 1, 2, 3, 4 호출 시 -> 3, 4 출력
   */
  skipWhile(predicate: (arg: T) => boolean): CallbackBuilder<T> {
    let skipping = true;
    this.ops.push((arg, next) => {
      if (skipping && predicate(arg)) {
        return;
      }
      skipping = false;
      next(arg);
    });
    return this;
  }

  // =================================================================
  // [빌드]
  // =================================================================

  /** 최종적으로 실행할 함수를 받아, 모든 파이프라인이 적용된 함수를 반환 */
  build(finalCallback: (arg: T) => void): (arg: any) => void {
    // 연산자들을 역순으로 합성 (Compose)
    // ops[0] -> ops[1] -> ... -> finalCallback 순서로 실행됨
    const pipeline = this.ops.reduceRight<Next<any>>(
      (next, op) => (arg) => op(arg, next),
      finalCallback
    );

    return pipeline;
  }
}
