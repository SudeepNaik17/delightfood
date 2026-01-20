
const mongoose = require("mongoose");
const MenuSchema = new mongoose.Schema({
  name: String,
  price: Number
});
module.exports = mongoose.model("Menu", MenuSchema);
