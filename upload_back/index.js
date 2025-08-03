import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import { uploadOnCloudinary } from "./cloudinary.js";
import { upload } from "./multer.middleware.js";
import cookieParser from "cookie-parser";

import { connectLocalDB } from "./config/localMongo.js";
import { connectRemoteDB } from "./config/remoteMongo.js";

import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRouter.js";
import eventRoutes from "./routes/events.js";
import Listing from "./models/Listing.js";
import userSchema from "./models/userModel.js"; // ✅ schema only, not model

dotenv.config(); // ✅ Load env before using it

const app = express();
const PORT = process.env.PORT || 5000;

// CORS config
const allowedOrigins = ["http://localhost:3000"];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const imageStorePath = "./image-urls.json";

// ✅ Utility: Save image URL
const saveImageUrl = (url) => {
  let data = [];

  if (fs.existsSync(imageStorePath)) {
    const fileContent = fs.readFileSync(imageStorePath, "utf-8");
    if (fileContent.trim()) {
      try {
        data = JSON.parse(fileContent);
      } catch (err) {
        console.error("❌ Failed to parse image-urls.json:", err);
        data = [];
      }
    }
  }

  data.push(url);
  fs.writeFileSync(imageStorePath, JSON.stringify(data, null, 2));
};

// ✅ Async server initializer
const startServer = async () => {
  try {
    // Step 1: Connect to DBs
    await connectLocalDB();
    const remoteConnection = await connectRemoteDB();
    const User = remoteConnection.model("user", userSchema);

    // Step 2: API routes
    app.use("/api/auth", authRouter(User));
    app.use("/api/user", userRouter(User));
    app.use("/api/events", eventRoutes);

    app.get("/api/artist", async (req, res) => {
      try {
        const artists = await Listing.find({});
        res.json(artists);
      } catch (err) {
        console.error("❌ Fetch Error:", err);
        res.status(500).json({ error: "Failed to fetch artists" });
      }
    });

    app.post("/upload", upload.single("art"), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const localFilePath = req.file.path;
        const result = await uploadOnCloudinary(localFilePath);

        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        if (!result) {
          return res.status(500).json({ error: "Upload failed" });
        }

        saveImageUrl(result.secure_url);
        res.json({ imageUrl: result.secure_url });
      } catch (err) {
        console.error("❌ Upload error:", err);
        res.status(500).json({ error: "Something went wrong during upload" });
      }
    });

    app.get("/gallery", (req, res) => {
      try {
        if (!fs.existsSync(imageStorePath)) return res.json({ images: [] });

        const fileContent = fs.readFileSync(imageStorePath, "utf-8");
        const data = fileContent.trim() ? JSON.parse(fileContent) : [];
        res.json({ images: data });
      } catch (err) {
        console.error("❌ Gallery error:", err);
        res.status(500).json({ error: "Failed to fetch gallery" });
      }
    });

    app.get("/", (req, res) => {
      res.send("🎨 Kalakriti API is working!");
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to initialize server:", err);
  }
};

// ✅ Start the server
startServer();
