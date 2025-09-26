const ApiError = require("../utils/ApiError");


function errorHandler(err, req, res, next) {
  console.error(err); // log for server-side debugging

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
      data: err.data || null
    });
  }

  // Fallback for unknown errors
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: [],
    data: null
  });
}

module.exports = errorHandler;
