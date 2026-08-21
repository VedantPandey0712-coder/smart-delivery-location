import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

// Default Leaflet marker icons don't load correctly with bundlers unless
// pointed at CDN assets explicitly.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER = [25.4484, 81.8437]; // Prayagraj, India — reasonable default

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/**
 * Props:
 *  - value: { lat, lng } | null
 *  - onChange: (lat, lng) => void
 */
export default function MapPicker({ value, onChange }) {
  const [locating, setLocating] = useState(false);
  const position = value ? [value.lat, value.lng] : DEFAULT_CENTER;

  function useMyLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        alert("Could not get your location: " + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div>
      <div className="map-wrap">
        <MapContainer center={position} zoom={value ? 17 : 13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {value && <Marker position={position} icon={markerIcon} />}
          <RecenterOnChange position={value ? position : null} />
        </MapContainer>
      </div>
      <div className="map-hint">
        <button type="button" className="btn btn-outline" onClick={useMyLocation} disabled={locating}>
          {locating ? <span className="spinner" style={{ borderTopColor: "#0b1f3a" }} /> : "📍"}
          {locating ? "Locating..." : "Use My Current Location (GPS)"}
        </button>
        <span>or tap on the map to drop the exact entrance pin</span>
      </div>
      {value && (
        <div className="hint" style={{ marginTop: 6 }}>
          Pin set at {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
