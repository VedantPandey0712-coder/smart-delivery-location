import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DeliveryPointsAPI } from "../api";

function scoreColor(score) {
  if (score >= 80) return "#14b8a6";
  if (score >= 50) return "#ff6b35";
  return "#dc2626";
}

export default function Home() {
  const [points, setPoints] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    DeliveryPointsAPI.list()
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error(data?.error || "Failed to load delivery points.");
        }
        setPoints(data);
      })
      .catch((err) => setError(err.message || "Failed to load delivery points."));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="eyebrow" style={{ color: "#ff6b35" }}>
            Intelligent Last-Mile Delivery
          </p>
          <h1>From an Address to a Verified Delivery Point.</h1>
          <p>
            Smart Delivery Location helps customers create precise, evidence-backed delivery points using GPS,
            exact entrance pins, building context, and photos — so riders find the door on the first try.
          </p>
          <div className="hero-actions">
            <Link to="/create" className="btn btn-primary">
              + Create a Delivery Point
            </Link>
            <a href="#points" className="btn btn-outline" style={{ background: "transparent", color: "white", borderColor: "rgba(255,255,255,0.3)" }}>
              View Existing Points
            </a>
          </div>
        </div>
      </section>

      <section className="page" id="points">
        <div className="container">
          <h2 className="section-title">Verified Delivery Points</h2>

          {error && <div className="card" style={{ color: "#dc2626" }}>{error}</div>}

          {!points && !error && <div className="empty-state">Loading delivery points…</div>}

          {points && points.length === 0 && (
            <div className="card empty-state">
              <p>No delivery points yet.</p>
              <Link to="/create" className="btn btn-primary" style={{ marginTop: 12 }}>
                Create the first one
              </Link>
            </div>
          )}

          {points && points.length > 0 && (
            <div className="point-list">
              {points.map((p) => (
                <Link to={`/points/${p.id}`} key={p.id} className="card point-card">
                  <div className="point-card-main">
                    <div className="point-card-address">{p.addressText}</div>
                    <div className="point-card-meta">
                      {p.towerBlock ? `${p.towerBlock} · ` : ""}
                      {p.gateEntrance ? `${p.gateEntrance} · ` : ""}
                      Created {new Date(p.createdAt).toLocaleDateString()}
                      {p.reportedIssueCount > 0 && (
                        <span className="badge badge-orange" style={{ marginLeft: 8 }}>
                          {p.reportedIssueCount} issue reported
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="score-chip" style={{ background: scoreColor(p.confidenceScore) }}>
                    {p.confidenceScore}%
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
