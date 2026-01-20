const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered with this email" });
    }

    // 2. Hash password and save
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ 
      email, 
      password: hash, 
      role: role || "user" // default to user if not provided
    });

    await user.save();
    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error during registration" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    // 2. Check if the role matches (Security check)
    // This prevents a 'user' from trying to log in via the 'admin' portal
    if (user.role !== role) {
      return res.status(403).json({ message: `Access denied. You are registered as a ${user.role}` });
    }

    // 3. Compare password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 4. Generate Token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      "secret", 
      { expiresIn: "1d" } // Token expires in 1 day
    );

    res.json({ 
      token, 
      role: user.role,
      message: "Login successful" 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;