class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = [], data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.errors = errors;
    this.success = false;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
