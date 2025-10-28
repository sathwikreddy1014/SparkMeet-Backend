const express = require("express");
const { connectDB } = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
require("./utils/cronJob");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chatRoutes");
const errorHandler = require("./utils/errorHandler");
const paymentRouter = require("./routes/payment");
const { validateWebhookSignature } = require("razorpay/dist/utils/razorpay-utils.js");

// ✅ Middleware setup
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
  })
);

// ✅ Must come BEFORE express.json()
app.use("/payment/webhook", express.raw({ type: "application/json" }));

// Normal parsers (for other routes)
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

// ✅ Error Handler
app.use(errorHandler);

connectDB()
  .then(() => {
    console.log("Database connection established...");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));
  })
  .catch((err) => console.error("Database connection failed!", err));
