const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema({
  items: Array,
  total: Number,
  token: String,
  email: String,
  paymentMethod: String, 
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Order', OrderSchema);
