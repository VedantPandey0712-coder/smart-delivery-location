const express = require("express");
const pool = require("../db");
const { upload, UPLOAD_DIR } = require("../middleware/upload");
const { calculateConfidenceScore, confidenceLabel } = require("../services/confidenceScore");

const router = express.Router();

// ---------- helpers ----------

function toPublicPhotoUrl(req, filename) {
  if (!filename) return null;
  const base = process.env.SERVER_BASE_URL || `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/${filename}`;
}

function serializeDeliveryPoint(row, req) {
  const { score, breakdown } = calculateConfidenceScore(row);
  return {
    id: row.id,
    addressText: row.address_text,
    latitude: row.latitude,
    longitude: row.longitude,
    gpsConfirmed: row.gps_confirmed,
    pinPlaced: row.pin_placed,
    towerBlock: row.tower_block,
    floorNumber: row.floor_number,
    flatNumber: row.flat_number,
    gateEntrance: row.gate_entrance,
    landmark: row.landmark,
    deliveryInstructions: row.delivery_instructions,
    photoUrl: row.photo_url ? toPublicPhotoUrl(req, row.photo_url) : null,
    confidenceScore: score,
    confidenceLabel: confidenceLabel(score),
    confidenceBreakdown: breakdown,
    reportedIssueCount: row.reported_issue_count,
    lastReportedReason: row.last_reported_reason,
    lastReportedAt: row.last_reported_at,
    successfulDeliveries: row.successful_deliveries,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function logEvent(client, deliveryPointId, eventType, notes = null) {
  await client.query(
    `INSERT INTO delivery_events (delivery_point_id, event_type, notes) VALUES ($1, $2, $3)`,
    [deliveryPointId, eventType, notes]
  );
}

async function fetchPointRow(id) {
  const { rows } = await pool.query(`SELECT * FROM delivery_points WHERE id = $1`, [id]);
  return rows[0] || null;
}

// ---------- routes ----------

// Create a new delivery point (Step 1: address text, optional customer info)
router.post("/", async (req, res, next) => {
  try {
    const { addressText, customerName, customerPhone } = req.body;
    if (!addressText || !addressText.trim()) {
      return res.status(400).json({ error: "addressText is required." });
    }

    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `INSERT INTO delivery_points (address_text, customer_name, customer_phone)
         VALUES ($1, $2, $3) RETURNING *`,
        [addressText.trim(), customerName || null, customerPhone || null]
      );
      const point = rows[0];
      await logEvent(client, point.id, "created", "Delivery point created from address text.");
      res.status(201).json(serializeDeliveryPoint(point, req));
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// List all delivery points (most recent first)
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM delivery_points ORDER BY created_at DESC LIMIT 200`);
    res.json(rows.map((r) => serializeDeliveryPoint(r, req)));
  } catch (err) {
    next(err);
  }
});

// Geospatial proximity search — e.g. /api/delivery-points/near?lat=25.45&lng=81.84&radius=500
// Demonstrates PostGIS ST_DWithin usage described in the "Data & Storage" layer.
router.get("/near", async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng query params are required." });
    const radiusMeters = radius ? Number(radius) : 500;

    const { rows } = await pool.query(
      `SELECT *, ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters
       FROM delivery_points
       WHERE location IS NOT NULL
         AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
       ORDER BY distance_meters ASC`,
      [Number(lng), Number(lat), radiusMeters]
    );
    res.json(
      rows.map((r) => ({ ...serializeDeliveryPoint(r, req), distanceMeters: Math.round(r.distance_meters) }))
    );
  } catch (err) {
    next(err);
  }
});

// Get single delivery point
router.get("/:id", async (req, res, next) => {
  try {
    const point = await fetchPointRow(req.params.id);
    if (!point) return res.status(404).json({ error: "Delivery point not found." });
    res.json(serializeDeliveryPoint(point, req));
  } catch (err) {
    next(err);
  }
});

// Update location / building / landmark / instructions fields (Steps 2-4)
router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await fetchPointRow(req.params.id);
    if (!existing) return res.status(404).json({ error: "Delivery point not found." });

    const {
      latitude,
      longitude,
      gpsConfirmed,
      pinPlaced,
      towerBlock,
      floorNumber,
      flatNumber,
      gateEntrance,
      landmark,
      deliveryInstructions,
    } = req.body;

    const client = await pool.connect();
    try {
      const hasCoords = latitude != null && longitude != null;
      const { rows } = await client.query(
        `UPDATE delivery_points SET
            latitude = COALESCE($1, latitude),
            longitude = COALESCE($2, longitude),
            location = CASE WHEN $1 IS NOT NULL AND $2 IS NOT NULL
                        THEN ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
                        ELSE location END,
            gps_confirmed = COALESCE($3, gps_confirmed),
            pin_placed = COALESCE($4, pin_placed),
            tower_block = COALESCE($5, tower_block),
            floor_number = COALESCE($6, floor_number),
            flat_number = COALESCE($7, flat_number),
            gate_entrance = COALESCE($8, gate_entrance),
            landmark = COALESCE($9, landmark),
            delivery_instructions = COALESCE($10, delivery_instructions),
            updated_at = now()
         WHERE id = $11
         RETURNING *`,
        [
          latitude ?? null,
          longitude ?? null,
          gpsConfirmed ?? (hasCoords ? true : null),
          pinPlaced ?? null,
          towerBlock ?? null,
          floorNumber ?? null,
          flatNumber ?? null,
          gateEntrance ?? null,
          landmark ?? null,
          deliveryInstructions ?? null,
          req.params.id,
        ]
      );
      await logEvent(client, req.params.id, "score_recalculated", "Delivery point details updated.");
      res.json(serializeDeliveryPoint(rows[0], req));
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// Upload the entrance / surrounding photo (Step 5)
router.post("/:id/photo", upload.single("photo"), async (req, res, next) => {
  try {
    const existing = await fetchPointRow(req.params.id);
    if (!existing) return res.status(404).json({ error: "Delivery point not found." });
    if (!req.file) return res.status(400).json({ error: "No photo file received (field name: 'photo')." });

    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `UPDATE delivery_points SET photo_url = $1, updated_at = now() WHERE id = $2 RETURNING *`,
        [req.file.filename, req.params.id]
      );
      await logEvent(client, req.params.id, "score_recalculated", "Entrance photo uploaded.");
      res.json(serializeDeliveryPoint(rows[0], req));
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// Rider feedback loop — report a location issue
router.post("/:id/report-issue", async (req, res, next) => {
  try {
    const existing = await fetchPointRow(req.params.id);
    if (!existing) return res.status(404).json({ error: "Delivery point not found." });
    const { reason } = req.body;

    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `UPDATE delivery_points SET
            reported_issue_count = reported_issue_count + 1,
            last_reported_reason = $1,
            last_reported_at = now(),
            updated_at = now()
         WHERE id = $2 RETURNING *`,
        [reason || "Rider reported a location issue.", req.params.id]
      );
      await logEvent(client, req.params.id, "issue_reported", reason || null);
      res.json(serializeDeliveryPoint(rows[0], req));
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// Mark a successful delivery (Historical Verification)
router.post("/:id/mark-delivered", async (req, res, next) => {
  try {
    const existing = await fetchPointRow(req.params.id);
    if (!existing) return res.status(404).json({ error: "Delivery point not found." });

    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `UPDATE delivery_points SET
            successful_deliveries = successful_deliveries + 1,
            updated_at = now()
         WHERE id = $1 RETURNING *`,
        [req.params.id]
      );
      await logEvent(client, req.params.id, "delivered", "Marked as successfully delivered.");
      res.json(serializeDeliveryPoint(rows[0], req));
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// Event history for a point
router.get("/:id/events", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM delivery_events WHERE delivery_point_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
