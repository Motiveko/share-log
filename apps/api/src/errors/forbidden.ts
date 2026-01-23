export class ForbiddenError extends Error {
  public status: number;
  constructor(message = "Forbidden") {
    super(message);
    this.status = 403;
  }
}
