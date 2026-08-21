-- Smart Delivery Location — database schema
-- Requires the PostGIS extension (available by default on Neon, Supabase,
-- Render Postgres, and most managed Postgres providers).

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- delivery_points
--   The core "Verified Delivery Point Profile" described in
--   the DoorPin / Smart Delivery Location pitch deck.
-- =========================================================
CREATE TABLE IF NOT EXISTS delivery_points (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Step 1: text address as typed by the customer
    address_text        TEXT NOT NULL,

    -- Step 2 & 3: GPS confirmation + exact entrance pin
    -- Stored as a real geospatial point (SRID 4326 = WGS84 lat/lng)
    location             GEOGRAPHY(Point, 4326),
    latitude             DOUBLE PRECISION,
    longitude            DOUBLE PRECISION,
    gps_confirmed        BOOLEAN NOT NULL DEFAULT FALSE,
    pin_placed           BOOLEAN NOT NULL DEFAULT FALSE,

    -- Step 4: building / context info
    tower_block          TEXT,
    floor_number         TEXT,
    flat_number          TEXT,
    gate_entrance        TEXT,
    landmark             TEXT,
    delivery_instructions TEXT,

    -- Step 5: visual evidence
    photo_url            TEXT,

    -- Step 6: computed confidence score (0-100) + breakdown (JSON)
    confidence_score      INTEGER NOT NULL DEFAULT 0,
    confidence_breakdown   JSONB NOT NULL DEFAULT '[]'::JSONB,

    -- Rider feedback loop
    reported_issue_count  INTEGER NOT NULL DEFAULT 0,
    last_reported_reason  TEXT,
    last_reported_at      TIMESTAMPTZ,

    -- Historical verification
    successful_deliveries INTEGER NOT NULL DEFAULT 0,

    customer_name         TEXT,
    customer_phone        TEXT,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Geospatial index for fast "nearby" / proximity queries
CREATE INDEX IF NOT EXISTS idx_delivery_points_location
    ON delivery_points USING GIST (location);

-- =========================================================
-- delivery_events
--   Historical log: created, delivered, issue reported, etc.
--   Powers "Historical Verification" from the pitch deck.
-- =========================================================
CREATE TABLE IF NOT EXISTS delivery_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_point_id   UUID NOT NULL REFERENCES delivery_points(id) ON DELETE CASCADE,
    event_type          TEXT NOT NULL, -- 'created' | 'delivered' | 'issue_reported' | 'score_recalculated'
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_events_point
    ON delivery_events (delivery_point_id);
