const express = require("express");
const { connectDB } = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
require("./utils/cronJob");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chatRoutes");
const paymentRouter = require("./routes/payment");
const errorHandler = require("./utils/errorHandler");

// ✅ CORS
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
  })
);

// ✅ Must come BEFORE express.json()
// Razorpay sends RAW body for signature validation
app.post(
  "/payment/webhook",
  bodyParser.raw({ type: "application/json" }),
  require("./routes/payment").handleWebhook
);

// ✅ Normal parsers for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Routes
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);
app.use("/", paymentRouter);

// ✅ Custom error handler
app.use(errorHandler);

// ✅ DB + Server Start
connectDB()
  .then(() => {
    console.log("✅ Database connected successfully");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}...`)
    );
  })
  .catch((err) => console.error("❌ Database connection failed:", err));
