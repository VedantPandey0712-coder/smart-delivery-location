# Smart Delivery Location

**Intelligent Last-Mile Delivery Location Verification Platform.**

Smart Delivery Location aims to improve last-mile delivery accuracy by helping customers provide precise delivery locations using GPS coordinates, exact entrance information, landmarks, photographs, and a **Location Confidence Score**.

## Problem

Delivery partners often reach the correct general address but struggle to find the exact building, entrance, gate, tower, or delivery point.

## Proposed Solution

Smart Delivery Location creates a **Verified Delivery Point** using multiple sources of location information and generates a confidence score indicating how accurately the delivery location has been identified.

## Core Features

- ✅ Exact delivery location pin (interactive map)
- ✅ GPS confirmation
- ✅ Entrance / gate identification
- ✅ Building context (tower, floor, flat)
- ✅ Landmark information
- ✅ Delivery instructions
- ✅ Surrounding/entrance photo upload
- ✅ Location Confidence Score (30% → 50% → 65% → 80% → 95%)
- ✅ Delivery partner (rider) interface
- ✅ Rider feedback loop ("Report Issue")
- ✅ Historical delivery verification

## Project Status

🚧 Under active development — Round 2 (Production-Level Project Submission)

---

## Tech Stack

| Layer                 | Technology                                              |
| ---------------------- | -------------------------------------------------------- |
| Frontend Interface     | React 18 + Vite, React Router, Leaflet (map picker)      |
| Backend Services       | Node.js + Express (REST API)                              |
| Verification Engine    | Rule-based Location Confidence Score engine (Node)        |
| Data & Storage         | PostgreSQL + **PostGIS** (geospatial queries), local disk for photos |
| Future AI Module       | Planned: ML difficulty prediction, computer-vision photo validation |

This directly matches the "Modern Layered Architecture" slide in the pitch deck.

---

## Project Structure

```
smart-delivery-location/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── components/        # MapPicker, ConfidenceMeter, Stepper, Toast
│       ├── pages/              # Home, CreateDeliveryPoint, DeliveryPointDetail
│       ├── api.js              # API client
│       └── App.jsx
├── server/                    # Node + Express backend
│   └── src/
│       ├── routes/deliveryPoints.js
│       ├── services/confidenceScore.js   # scoring engine
│       ├── middleware/upload.js          # photo upload (multer)
│       ├── db/schema.sql                 # PostGIS schema
│       └── index.js
├── docker-compose.yml         # local PostGIS database
└── README.md
```

---

## Getting Started

### 1. Start the database (PostGIS)

The easiest way — using Docker:

```bash
docker compose up -d
```

This starts PostgreSQL with PostGIS pre-installed on `localhost:5432`
(user: `postgres`, password: `postgres`, db: `smart_delivery_location`).

> No Docker? Any Postgres instance with the PostGIS extension works — including free hosted options like [Neon](https://neon.tech) or [Supabase](https://supabase.com). Just update `DATABASE_URL` in `server/.env`.

### 2. Set up the backend

```bash
cd server
cp .env.example .env      # edit if your DB connection differs
npm install
npm run db:init            # creates the PostGIS extension + tables
npm run dev                 # starts API on http://localhost:5000
```

### 3. Set up the frontend

```bash
cd client
npm install
npm run dev                 # starts app on http://localhost:5173
```

Open **http://localhost:5173** and create your first Verified Delivery Point.

---

## API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint                              | Description                                  |
| ------ | -------------------------------------- | --------------------------------------------- |
| POST   | `/delivery-points`                     | Create a delivery point (Step 1: address)     |
| GET    | `/delivery-points`                     | List all delivery points                       |
| GET    | `/delivery-points/near?lat=&lng=&radius=` | Geospatial proximity search (PostGIS)      |
| GET    | `/delivery-points/:id`                 | Get one delivery point                         |
| PATCH  | `/delivery-points/:id`                 | Update GPS / pin / building / landmark fields  |
| POST   | `/delivery-points/:id/photo`           | Upload entrance photo (`multipart/form-data`, field `photo`) |
| POST   | `/delivery-points/:id/report-issue`    | Rider feedback loop                            |
| POST   | `/delivery-points/:id/mark-delivered`  | Log a successful delivery (history)            |
| GET    | `/delivery-points/:id/events`          | Event history for a point                      |

## Location Confidence Score

Implemented in `server/src/services/confidenceScore.js`, matching the pitch deck exactly:

| Evidence Provided                  | Score |
| ----------------------------------- | ----- |
| Address only                        | 30%   |
| + GPS match                          | 50%   |
| + Exact entrance pin                 | 65%   |
| + Gate / Tower / Flat details        | 80%   |
| + Entrance photo evidence            | 95%   |

A small bonus (up to +5%) is added for a track record of successful past deliveries at that point ("Historical Verification").

---

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full step-by-step guide to deploy this live using Neon (database), Render (API), and Vercel (frontend) — all free tiers.

## Roadmap

- [x] Core MVP — location form, exact GPS pin, confidence engine
- [x] Rider experience — entrance details, landmark, photo upload, rider UI
- [x] Verification — rider feedback loop, historical verification
- [ ] Intelligence — ML difficulty prediction, computer-vision photo validation
- [ ] Scale integration — logistics API SDKs, food & e-commerce platform integration
