const router = require("express").Router();
const Order = require("../models/Order");
const jwt = require("jsonwebtoken");

// Middleware
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("No token provided");
  try {
    const decoded = jwt.verify(authHeader, "secret");
    if (decoded.role !== "admin") return res.status(403).send("Admins only");
    next();
  } catch (err) { res.status(401).send("Invalid token"); }
}

// 1. PLACE ORDER
router.post("/", async (req, res) => {
  try {
    const { email, items, total, paymentMethod } = req.body;
    if (!email) return res.status(400).send("Email missing");

    const count = await Order.countDocuments();
    const token = "CAF-" + (count + 1001);

    const newOrder = new Order({
      email: email.toLowerCase().trim(),
      items,
      total,
      paymentMethod,
      token,
      status: "Pending"
    });
    await newOrder.save();
    res.json({ token });
  } catch (err) { res.status(500).send("Order failed"); }
});

// 2. GET USER HISTORY (Decodes cookie email)
router.get("/user/:email", async (req, res) => {
  try {
    const decodedEmail = decodeURIComponent(req.params.email).toLowerCase().trim();
    const myOrders = await Order.find({ email: decodedEmail }).sort({ createdAt: -1 });
    res.json(myOrders);
  } catch (err) { res.status(500).json([]); }
});

// 3. ADMIN GET ALL
router.get("/admin/all", verifyAdmin, async (req, res) => {
  const all = await Order.find().sort({ createdAt: -1 });
  res.json(all);
});

// 4. UPDATE STATUS
router.put("/:id", verifyAdmin, async (req, res) => {
  await Order.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.send("Updated");
});

module.exports = router;