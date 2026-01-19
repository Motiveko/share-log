export class BadRequestError extends Error {
  public status: number;
  constructor(message = "Bad Request") {
    super(message);
    this.status = 400;
  }
}
