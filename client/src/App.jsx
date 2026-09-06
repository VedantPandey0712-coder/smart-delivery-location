import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import CreateDeliveryPoint from "./pages/CreateDeliveryPoint";
import DeliveryPointDetail from "./pages/DeliveryPointDetail";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import { AuthProvider, useAuth } from "./auth";

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
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
            {!loading && (user ? (
              <button className="nav-account" onClick={signOut} title={`Sign out ${user.fullName}`}>
                {user.fullName.split(" ")[0]} · Sign out
              </button>
            ) : (
              <Link to="/signin" className={location.pathname === "/signin" ? "active" : ""}>
                Sign in
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateDeliveryPoint />} />
        <Route path="/points/:id" element={<DeliveryPointDetail />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <Link to="/" className="footer-brand">
              <span className="dot" />
              Smart Delivery Location
            </Link>
            <p className="footer-note">Clearer addresses. Smoother handoffs. Better first attempts.</p>
          </div>
          <div className="footer-links">
            <Link to="/">Explore points</Link>
            <Link to="/create">Create a point</Link>
          </div>
          <div className="footer-status">
            <span className="status-dot" />
            Built for confident deliveries
          </div>
        </div>
      </footer>
    </>
  );
}
