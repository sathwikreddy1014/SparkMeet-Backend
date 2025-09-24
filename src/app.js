const express = require("express");
require("dotenv").config(); // Load env vars FIRST
const { connectDB } = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors")
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const requestRouter = require('./routes/request');
const userRouter = require("./routes/user");
const chatrouter = require("./routes/chatRoutes");

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/', authRouter);
app.use('/', profileRouter);
app.use('/', requestRouter);
app.use('/', userRouter);
app.use('/', chatrouter)

connectDB()
  .then(() => {
    console.log("MongoDB connection successful");
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server started on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed: " + err.message);
  });
