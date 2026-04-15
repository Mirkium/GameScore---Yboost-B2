export type ErrorDetails = Readonly<Record<string, readonly string[]>>;

export class AppError extends Error {
  public readonly statusCode: number;

  public readonly details?: ErrorDetails;

  public constructor(statusCode: number, message: string, details?: ErrorDetails) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}