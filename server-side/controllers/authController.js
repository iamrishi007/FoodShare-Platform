const User = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.SECRET_KEY

const register = async (req, res) => {
     try {
          const { username, password } = req.body;

          let user = await User.findOne({ username });
          if (user) {
               res.status(400).json({ message: "User already exists" })
               return;
          }

          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt)

          user = new User({ username, password: hashedPassword })
          await user.save();

          res.status(201).json({ message: "User registered successfully" })
     } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Server error" })
     }
};

const login = async (req, res) => {
     try {
          const { username, password } = req.body;

          const user = await User.findOne({ username })
          if (!user) {
               res.status(400).json({ message: "Invalid credentials" })
               return;
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
               res.status(400).json({ message: "Invalid credentials" });
               return;
          }


          const payload = { userId: user._id, username: user.username };
          const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

          res.json({ token, message: "Login successful" })
     } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Server error" })
     }
};

module.exports = {
     register,
     login,
};
