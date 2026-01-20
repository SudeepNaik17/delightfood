
const router = require("express").Router();
const Menu = require("../models/Menu");
const jwt = require("jsonwebtoken");

function verifyAdmin(req,res,next){
  const decoded = jwt.verify(req.headers.authorization,"secret");
  if(decoded.role!=="admin") return res.status(403).send("Admins only");
  next();
}

router.post("/", verifyAdmin, async(req,res)=>{
  await new Menu(req.body).save();
  res.send("Menu added");
});

router.get("/", async(req,res)=>{
  res.json(await Menu.find());
});
// Add this to your menu routes in the backend
router.delete("/:id", async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});
module.exports = router;
