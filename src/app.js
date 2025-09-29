const express = require("express");
require("dotenv").config();
const { connectDB } = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");

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

// CORS
const allowedOrigins = [process.env.FRONTEND_ORIGIN];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes with prefixes
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/request", requestRouter);
app.use("/api/users", userRouter);
app.use("/api/chat", chatRouter);

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, "Route not found"));
});

// Global error handler
app.use(errorHandler);

// Connect DB + Start server
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
