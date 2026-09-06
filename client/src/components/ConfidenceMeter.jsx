import React from "react";

function scoreColor(score) {
  if (score >= 80) return "#14b8a6";
  if (score >= 50) return "#ff6b35";
  return "#dc2626";
}

export default function ConfidenceMeter({ score, label, breakdown }) {
  const color = scoreColor(score);
  return (
    <div className="confidence-wrap">
      <div className="confidence-score-row">
        <div>
          <div className="confidence-score-value" style={{ color }}>
            {score}%
          </div>
        </div>
        <div className="confidence-score-label" style={{ background: `${color}22`, color }}>
          {label}
        </div>
      </div>
      <div className="confidence-track">
        <div className="confidence-fill" style={{ width: `${score}%` }} />
      </div>
      {breakdown && (
        <div className="confidence-breakdown">
          {breakdown.map((tier) => (
            <div key={tier.key} className={`confidence-tier ${tier.earned ? "earned" : ""}`}>
              <span className="tier-dot">{tier.earned ? "✓" : ""}</span>
              {tier.label} <span style={{ marginLeft: "auto", opacity: 0.7 }}>+{tier.points}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
