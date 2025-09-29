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
const ApiError = require("./utils/apiError"); // ⚠️ Make sure filename matches exactly (case-sensitive!)

const app = express();

// ✅ Allowed origins (make sure FRONTEND_ORIGIN is set in Render Dashboard)
const allowedOrigins = [process.env.FRONTEND_ORIGIN];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);

// ✅ 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, "Route not found"));
});

// ✅ Error handler (last middleware)
app.use(errorHandler);

// ✅ Connect DB + Start server
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to database", err);
  });
