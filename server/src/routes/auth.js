const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "smart-delivery-location-development-secret";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(row) {
  return { id: row.id, fullName: row.full_name, email: row.email };
}

function createToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function validateCredentials(fullName, email, password) {
  if (typeof fullName !== "string" || !fullName.trim()) return "Full name is required.";
  if (typeof email !== "string" || !emailRegex.test(email.trim())) return "A valid email address is required.";
  if (typeof password !== "string" || password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

router.post("/signup", async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    const validationError = validateCredentials(fullName, email, password);
    if (validationError) return res.status(400).json({ error: validationError });

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email`,
      [fullName.trim(), normalizedEmail, passwordHash]
    );
    const user = publicUser(rows[0]);
    res.status(201).json({ token: createToken(user), user });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "An account with that email already exists." });
    next(err);
  }
});

router.post("/signin", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || !emailRegex.test(email.trim()) || typeof password !== "string") {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const { rows } = await pool.query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1)`, [email.trim()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }

    const safeUser = publicUser(user);
    res.json({ token: createToken(safeUser), user: safeUser });
  } catch (err) {
    next(err);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    if (!token) return res.status(401).json({ error: "Authentication required." });

    const payload = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query(`SELECT id, full_name, email FROM users WHERE id = $1`, [payload.sub]);
    if (!rows[0]) return res.status(401).json({ error: "Account not found." });
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Your session has expired. Please sign in again." });
    }
    next(err);
  }
});

module.exports = router;
