const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌  MONGO_URI is not defined in .env");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Mongoose 8 uses these defaults — listed explicitly for clarity
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌  MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

// Surface Mongoose debug queries in development
if (process.env.NODE_ENV === "development") {
  mongoose.set("debug", false); // flip to true to log every query
}

// Handle post-connection events
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️   MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄  MongoDB reconnected");
});

module.exports = connectDB;
