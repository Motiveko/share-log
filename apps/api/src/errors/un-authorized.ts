export class UnauthorizedError extends Error {
  public status: number;
  constructor(message = "Unauthorized") {
    super(message);
    this.status = 401;
  }
}
