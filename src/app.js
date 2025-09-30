// src/app.js
const express = require("express");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { connectDB } = require("./config/database");

// Routers
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chatRoutes");

// Utils
const errorHandler = require("./utils/errorHandler");
const ApiError = require("./utils/apiError");

const app = express();

// ✅ CORS setup
const allowedOrigins = [process.env.FRONTEND_ORIGIN]; // e.g., https://your-frontend.com
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Body parser & cookies
app.use(express.json());
app.use(cookieParser());

// ✅ Health check / base route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 SparkMeet Backend is live!",
    timestamp: new Date().toISOString(),
  });
});

// ✅ API Routes with prefixes
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/request", requestRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);

// ✅ 404 handler (must be after all routes)
app.use((req, res, next) => {
  next(new ApiError(404, "Route not found"));
});

// ✅ Global error handler (last middleware)
app.use(errorHandler);

// ✅ Connect DB + start server
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to database", err);
  });

module.exports = app;
