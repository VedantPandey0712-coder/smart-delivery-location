const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "smart-delivery-location-development-secret";

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return res.status(401).json({ error: "Authentication required." });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ error: "Only delivery partners can mark deliveries as successful." });
    next();
  };
}

module.exports = { requireAuth, requireRole };
