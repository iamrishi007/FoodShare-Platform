const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");


router.post("/register", register)
router.post("/login", login)

router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({
    message: `Welcome ${req.user.username}, this is a protected dashboard.`,
  });
});


module.exports = router;