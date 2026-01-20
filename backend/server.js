const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config();

const auth = require("./routes/auth");
const menuRoutes = require("./routes/menu"); // Renamed to avoid conflict
const order = require("./routes/order");

// IMPORT YOUR MENU MODEL (Ensure the path is correct)
const MenuItem = require("./models/Menu"); 

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://delight-food-qnk5.onrender.com" 
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

// --- SEEDING FUNCTION ---
const seedDatabase = async () => {
    try {
        const count = await MenuItem.countDocuments();
        if (count === 0) {
            console.log("🗄️ Database empty. Seeding default items...");
            const defaultItems = [
                { name: "Veg Burger", price: 99 },
                { name: "Chicken Burger", price: 149 },
                { name: "French Fries", price: 79 },
                { name: "Veg Pizza", price: 199 },
                { name: "Chicken Pizza", price: 249 },
                { name: "Cold Coffee", price: 89 },
                { name: "Tea", price: 20 },
                { name: "Sandwich", price: 69 }
            ];
            await MenuItem.insertMany(defaultItems);
            console.log("✅ Default items added successfully!");
        }
    } catch (err) {
        console.error("❌ Seeding error:", err);
    }
};

// 2. MONGODB CONNECTION
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => {
        console.log("✅ Connected to MongoDB Atlas");
        seedDatabase(); // <--- RUN SEEDER HERE
    })
    .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use("/api/auth", auth);
app.use("/api/menu", menuRoutes);
app.use("/api/order", order);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});