const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.SECRET_KEY;

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" })
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token, authorization denied" });
  }
};

module.exports = authMiddleware;
