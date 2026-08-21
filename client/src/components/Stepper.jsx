import React from "react";

const STEPS = ["Address", "GPS Match", "Exact Pin", "Building Info", "Photo Evidence"];

export default function Stepper({ current }) {
  return (
    <div className="stepper">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const state = stepNum < current ? "done" : stepNum === current ? "active" : "";
        return (
          <div key={label} className={`step-pill ${state}`}>
            <span className="num">{stepNum < current ? "✓" : stepNum}</span>
            {label}
          </div>
        );
      })}
    </div>
  );
}
