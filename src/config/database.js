const mongoose = require("mongoose")

const connectDB = async () => {
    await mongoose.connect(
        "mongodb+srv://sathwik1014_db_user:bWvPa51M2SAORSfK@spark.ldi3xtk.mongodb.net/SparkMeet"
    );
};

module.exports = {
    connectDB
}

