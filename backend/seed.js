require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// 1. Define Models (Internal for this example)
const menuItemSchema = new mongoose.Schema({
    name: String,
    price: Number,
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// 2. Seeding Function
const seedDatabase = async () => {
    try {
        const count = await MenuItem.countDocuments();
        if (count === 0) {
            console.log("🗄️ Database is empty. Seeding default data...");
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
        } else {
            console.log("ℹ️ Database already has data. Skipping seed.");
        }
    } catch (err) {
        console.error("❌ Seeding error:", err);
    }
};

// 3. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected Successfully");
        seedDatabase(); // Run the seed function
    })
    .catch(err => console.error("❌ Connection Error:", err));

// 4. Sample Route to verify data
app.get('/api/menu', async (req, res) => {
    const items = await MenuItem.find();
    res.json(items);
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));