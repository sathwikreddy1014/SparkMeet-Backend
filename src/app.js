const express = require("express");
require("dotenv").config();
const { connectDB } = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const chatrouter = require("./routes/chatRoutes");

const errorHandler = require("./utils/errorHandler"); // ✅ import
const ApiError = require("./utils/apiError.js");              // ✅ import

const app = express();

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

// Routes
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatrouter);

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, "Route not found"));
});

// Error handler (MUST be last)
app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => {
    // handle error silently or with custom logic
  });

