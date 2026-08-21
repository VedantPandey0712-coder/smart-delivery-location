require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const deliveryPointsRouter = require("./routes/deliveryPoints");
const errorHandler = require("./middleware/errorHandler");
const { UPLOAD_DIR } = require("./middleware/upload");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(morgan("dev"));
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "smart-delivery-location-api" });
});

app.use("/api/delivery-points", deliveryPointsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Smart Delivery Location API running on http://localhost:${PORT}`);
});
