const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Force dotenv to load from the project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log("🧩 Loaded MONGO_URI:", uri ? uri.slice(0, 40) + "..." : "undefined");

    if (!uri) throw new Error("MONGO_URI not found in environment variables");

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }
};

module.exports = { connectDB };
