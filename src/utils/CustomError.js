export default class CustomError extends Error {
  constructor(errorCode, extra) {
    const { id, status, msg } = errorCode;
    super(`${msg} ${extra}`);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }

    // Custom debugging information
    this.errorCode = errorCode;
    this.extra = extra;
    this.date = new Date();
  }
}
