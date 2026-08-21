import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ConfidenceMeter from "../components/ConfidenceMeter";
import Toast from "../components/Toast";
import { DeliveryPointsAPI } from "../api";

export default function DeliveryPointDetail() {
  const { id } = useParams();
  const [point, setPoint] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [reportReason, setReportReason] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);
  const [busy, setBusy] = useState(false);

  function load() {
    DeliveryPointsAPI.get(id)
      .then(setPoint)
      .catch((err) => setError(err.response?.data?.error || "Delivery point not found."));
  }

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(message, type = "info") {
    setToast({ message, type });
  }

  async function handleReportIssue() {
    setBusy(true);
    try {
      const updated = await DeliveryPointsAPI.reportIssue(id, reportReason || undefined);
      setPoint(updated);
      setShowReportForm(false);
      setReportReason("");
      showToast("Issue reported — this location will be flagged for review.");
    } catch (err) {
      showToast("Could not report issue.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkDelivered() {
    setBusy(true);
    try {
      const updated = await DeliveryPointsAPI.markDelivered(id);
      setPoint(updated);
      showToast("Marked as successfully delivered. Confidence updated!");
    } catch (err) {
      showToast("Could not update delivery status.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <div className="card empty-state">
            <p>{error}</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>
              Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!point) {
    return (
      <div className="page">
        <div className="container">Loading…</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <p className="eyebrow">Verified Delivery Point</p>
        <h1 className="page-title">{point.addressText}</h1>
        <p className="page-subtitle">
          This is what the rider sees, plus the underlying confidence data behind it.
        </p>

        <div className="grid grid-2" style={{ alignItems: "start" }}>
          {/* Rider-facing phone mockup */}
          <div>
            <h3 className="section-title" style={{ fontSize: 16 }}>
              What the Rider Sees
            </h3>
            <div className="rider-phone">
              <div className="rider-screen">
                <div className="rider-badge">DESTINATION</div>
                <div className="rider-address">📍 {point.addressText}</div>

                {(point.towerBlock || point.floorNumber || point.flatNumber) && (
                  <>
                    <div className="rider-field-label">Building</div>
                    <div className="rider-field-value">
                      {[point.towerBlock, point.floorNumber, point.flatNumber].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </>
                )}

                {point.gateEntrance && (
                  <>
                    <div className="rider-field-label">Entrance</div>
                    <div className="rider-field-value">{point.gateEntrance}</div>
                  </>
                )}

                {point.landmark && (
                  <>
                    <div className="rider-field-label">Landmark</div>
                    <div className="rider-field-value">{point.landmark}</div>
                  </>
                )}

                {point.deliveryInstructions && (
                  <>
                    <div className="rider-field-label">Instructions</div>
                    <div className="rider-field-value">{point.deliveryInstructions}</div>
                  </>
                )}

                <div className="rider-photo-box">
                  {point.photoUrl ? (
                    <img src={point.photoUrl} alt="Entrance evidence" />
                  ) : (
                    <div className="rider-photo-empty">No entrance photo uploaded yet</div>
                  )}
                </div>

                {!showReportForm ? (
                  <button className="btn btn-danger-outline btn-block" onClick={() => setShowReportForm(true)}>
                    ⚠ Report Issue
                  </button>
                ) : (
                  <div>
                    <textarea
                      placeholder="What's wrong with this location?"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      style={{ marginBottom: 8 }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowReportForm(false)}>
                        Cancel
                      </button>
                      <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleReportIssue} disabled={busy}>
                        Submit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button className="btn btn-secondary btn-block" style={{ marginTop: 16, maxWidth: 360 }} onClick={handleMarkDelivered} disabled={busy}>
              ✓ Mark as Successfully Delivered
            </button>
          </div>

          {/* Confidence + meta */}
          <div>
            <h3 className="section-title" style={{ fontSize: 16 }}>
              Location Confidence Score
            </h3>
            <ConfidenceMeter score={point.confidenceScore} label={point.confidenceLabel} breakdown={point.confidenceBreakdown} />

            <div className="card" style={{ marginTop: 20 }}>
              <h4 style={{ marginTop: 0 }}>Verification History</h4>
              <p style={{ fontSize: 13.5, color: "#6b7280", margin: "4px 0" }}>
                Successful deliveries: <strong style={{ color: "#0b1f3a" }}>{point.successfulDeliveries}</strong>
              </p>
              <p style={{ fontSize: 13.5, color: "#6b7280", margin: "4px 0" }}>
                Issues reported: <strong style={{ color: "#0b1f3a" }}>{point.reportedIssueCount}</strong>
              </p>
              {point.lastReportedReason && (
                <p style={{ fontSize: 13.5, color: "#6b7280", margin: "4px 0" }}>
                  Last reported reason: <em>{point.lastReportedReason}</em>
                </p>
              )}
              {point.latitude && point.longitude && (
                <p style={{ fontSize: 13.5, color: "#6b7280", margin: "4px 0" }}>
                  Coordinates: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </div>
  );
}
