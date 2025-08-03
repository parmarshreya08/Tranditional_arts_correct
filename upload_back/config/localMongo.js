


// config/localMongo.js "mongodb://localhost:27017/artist";
import mongoose from "mongoose";

const connectLocalDB = async () => {
  try {
    const uri = process.env.MONGO_LOCAL_URI;
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to LOCAL MongoDB using mongoose.connect");
  } catch (err) {
    console.error("❌ Local MongoDB connection error:", err.message);
  }
};

export { connectLocalDB };
