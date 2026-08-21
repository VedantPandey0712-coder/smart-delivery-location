import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import CreateDeliveryPoint from "./pages/CreateDeliveryPoint";
import DeliveryPointDetail from "./pages/DeliveryPointDetail";

export default function App() {
  const location = useLocation();
  return (
    <>
      <header className="topbar">
        <div className="container">
          <Link to="/" className="brand">
            <span className="dot" />
            Smart Delivery Location
          </Link>
          <nav className="nav-links">
            <Link to="/" className={location.pathname === "/" ? "active" : ""}>
              Home
            </Link>
            <Link to="/create" className={location.pathname === "/create" ? "active" : ""}>
              Create Delivery Point
            </Link>
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateDeliveryPoint />} />
        <Route path="/points/:id" element={<DeliveryPointDetail />} />
      </Routes>
    </>
  );
}
