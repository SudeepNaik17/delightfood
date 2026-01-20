const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config(); // Load environment variables

const auth = require("./routes/auth");
const menu = require("./routes/menu");
const order = require("./routes/order");

const app = express();

// 1. DYNAMIC CORS: Replace with your actual Render frontend URL later
const allowedOrigins = [
    "http://localhost:5173", // For local development
    "https://delight-food.onrender.com" // Your Render frontend link
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy violation'));
        }
    },
    credentials: true
}));

app.use(express.json());

// 2. MONGODB ATLAS CONNECTION: Use process.env.MONGO_URI
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/cafeteria";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use("/api/auth", auth);
app.use("/api/menu", menu);
app.use("/api/order", order);

// 3. DYNAMIC PORT: Render assigns a random port via process.env.PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});