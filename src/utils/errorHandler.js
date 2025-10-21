const ApiError = require("../utils/apiError");

function errorHandler(err, req, res, next) {
  console.error("🔥 Error:", err);

  // ✅ If it's an ApiError (your custom one)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,   // 👈 Shows your ApiError message
      errors: err.errors || [],
      data: err.data || null,
    });
  }

  // ✅ Fallback for unknown errors
  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: [],
    data: null,
  });
}

module.exports = errorHandler;
