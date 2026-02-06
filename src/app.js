const express = require("express");
const { connectDB } = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const http= require("http")
require("dotenv").config();
require("./utils/cronJob");

// ✅ Import routes
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const paymentRouter = require("./routes/payment");
const errorHandler = require("./utils/errorHandler");
const initializeSocket = require("./config/socket");
const chatRouter = require("./routes/chatRoutes");

// ✅ CORS
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
  })
);

/* ======================================================
   🔹 RAW BODY PARSER (only for Razorpay Webhook)
====================================================== */
// This must come BEFORE express.json()
app.use(
  "/payment/webhook",
  bodyParser.raw({ type: "*/*" })
);

/* ======================================================
   🔹 NORMAL PARSERS for all other routes
====================================================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ======================================================
   🔹 ROUTES
====================================================== */
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);
app.use("/", chatRouter);

const server = http.createServer(app);
initializeSocket(server);

/* ======================================================
   🔹 ERROR HANDLER
====================================================== */
app.use(errorHandler);

/* ======================================================
   🔹 CONNECT DB + START SERVER
====================================================== */
connectDB()
  .then(() => {
    console.log("✅ Database connected successfully");
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}...`));
  })
  .catch((err) => console.error("❌ Database connection failed:", err));

  