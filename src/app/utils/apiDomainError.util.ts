export class ApiDomainError extends Error {
  constructor(
    message: string,
    readonly status: number = 400
  ) {
    super(message);
    this.name = "ApiDomainError";
  }
}
