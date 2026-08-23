import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_BASE_URL = configuredApiUrl.replace(/^VITE_API_BASE_URL=/, "").replace(/\/$/, "");
const LOCAL_POINTS_KEY = "smart-delivery-location.points";

export const api = axios.create({ baseURL: API_BASE_URL });

function localPoints() {
  return JSON.parse(localStorage.getItem(LOCAL_POINTS_KEY) || "[]");
}

function saveLocalPoints(points) {
  localStorage.setItem(LOCAL_POINTS_KEY, JSON.stringify(points));
}

function localConfidence(point) {
  const breakdown = [
    { label: "Address", points: point.addressText ? 30 : 0 },
    { label: "GPS confirmation", points: point.gpsConfirmed ? 20 : 0 },
    { label: "Exact pin", points: point.pinPlaced ? 15 : 0 },
    { label: "Building context", points: point.towerBlock || point.flatNumber || point.gateEntrance ? 20 : 0 },
    { label: "Photo evidence", points: point.photoUrl ? 15 : 0 },
  ];
  const score = breakdown.reduce((total, item) => total + item.points, 0);
  return { confidenceScore: score, confidenceLabel: score >= 80 ? "High confidence" : score >= 50 ? "Medium confidence" : "Getting started", confidenceBreakdown: breakdown };
}

function localPoint(payload, existing = {}) {
  const point = { ...existing, ...payload, id: existing.id || crypto.randomUUID(), createdAt: existing.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
  return { ...point, ...localConfidence(point) };
}

function createLocal(payload) {
  const point = localPoint(payload);
  saveLocalPoints([point, ...localPoints()]);
  return point;
}

function updateLocal(id, payload) {
  const points = localPoints();
  const point = localPoint(payload, points.find((item) => item.id === id) || { id });
  saveLocalPoints(points.map((item) => (item.id === id ? point : item)));
  return point;
}

async function withLocalFallback(remoteRequest, localRequest) {
  try {
    return await remoteRequest();
  } catch (error) {
    console.warn("Using local storage because the API is unavailable.", error.message);
    return localRequest();
  }
}

export const DeliveryPointsAPI = {
  create: (payload) => withLocalFallback(() => api.post("/delivery-points", payload).then((r) => r.data), () => createLocal(payload)),
  list: () => withLocalFallback(() => api.get("/delivery-points").then((r) => r.data), () => localPoints()),
  get: (id) => withLocalFallback(() => api.get(`/delivery-points/${id}`).then((r) => r.data), () => localPoints().find((item) => item.id === id)),
  update: (id, payload) => withLocalFallback(() => api.patch(`/delivery-points/${id}`, payload).then((r) => r.data), () => updateLocal(id, payload)),
  uploadPhoto: (id, file) => {
    const form = new FormData();
    form.append("photo", file);
    return withLocalFallback(
      () => api.post(`/delivery-points/${id}/photo`, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data),
      () => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(updateLocal(id, { photoUrl: reader.result }));
        reader.readAsDataURL(file);
      })
    );
  },
  reportIssue: (id, reason) => withLocalFallback(() => api.post(`/delivery-points/${id}/report-issue`, { reason }).then((r) => r.data), () => updateLocal(id, { lastReportedReason: reason, reportedIssueCount: (localPoints().find((item) => item.id === id)?.reportedIssueCount || 0) + 1 })),
  markDelivered: (id) => withLocalFallback(() => api.post(`/delivery-points/${id}/mark-delivered`).then((r) => r.data), () => updateLocal(id, { successfulDeliveries: (localPoints().find((item) => item.id === id)?.successfulDeliveries || 0) + 1 })),
  events: (id) => withLocalFallback(() => api.get(`/delivery-points/${id}/events`).then((r) => r.data), () => []),
};
