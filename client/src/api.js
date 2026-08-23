import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_BASE_URL = configuredApiUrl.replace(/^VITE_API_BASE_URL=/, "").replace(/\/$/, "");

export const api = axios.create({ baseURL: API_BASE_URL });

export const DeliveryPointsAPI = {
  create: (payload) => api.post("/delivery-points", payload).then((r) => r.data),
  list: () => api.get("/delivery-points").then((r) => r.data),
  get: (id) => api.get(`/delivery-points/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/delivery-points/${id}`, payload).then((r) => r.data),
  uploadPhoto: (id, file) => {
    const form = new FormData();
    form.append("photo", file);
    return api
      .post(`/delivery-points/${id}/photo`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  reportIssue: (id, reason) => api.post(`/delivery-points/${id}/report-issue`, { reason }).then((r) => r.data),
  markDelivered: (id) => api.post(`/delivery-points/${id}/mark-delivered`).then((r) => r.data),
  events: (id) => api.get(`/delivery-points/${id}/events`).then((r) => r.data),
};
