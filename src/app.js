const express = require("express");
const { connectDB } = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
require("./utils/cronJob")

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chatRoutes");
const errorHandler = require("./utils/errorHandler"); // ✅ Import custom error handler

// ✅ Middleware setup
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
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

// ✅ Custom error-handling middleware (MUST be after all routes)
app.use(errorHandler);

connectDB()
  .then(() => {
    console.log("Database connection established...");
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server is successfully listening on port ${PORT}...`);
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!", err);
  });
