export class NotFoundError extends Error {
  public status: number;
  constructor(message = "Not Found") {
    super(message);
    this.status = 404;
    // es5 이하 트랜스파일 환경에서 instanceof가 제대로 작동하도록 프로토타입 체인 설정
    // Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
