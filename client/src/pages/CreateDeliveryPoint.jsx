import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../components/Stepper";
import MapPicker from "../components/MapPicker";
import ConfidenceMeter from "../components/ConfidenceMeter";
import Toast from "../components/Toast";
import { DeliveryPointsAPI } from "../api";

const initialForm = {
  addressText: "",
  customerName: "",
  customerPhone: "",
  coords: null, // { lat, lng }
  towerBlock: "",
  floorNumber: "",
  flatNumber: "",
  gateEntrance: "",
  landmark: "",
  deliveryInstructions: "",
};

export default function CreateDeliveryPoint() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [pointId, setPointId] = useState(null);
  const [live, setLive] = useState(null); // latest server copy (for confidence meter)
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function showToast(message, type = "info") {
    setToast({ message, type });
  }

  // ---- Step 1: create the record ----
  async function handleCreate(e) {
    e.preventDefault();
    if (!form.addressText.trim()) return showToast("Please enter an address.", "error");
    setSaving(true);
    try {
      const point = await DeliveryPointsAPI.create({
        addressText: form.addressText,
        customerName: form.customerName || undefined,
        customerPhone: form.customerPhone || undefined,
      });
      setPointId(point.id);
      setLive(point);
      setStep(2);
    } catch (err) {
      showToast(err.response?.data?.error || "Could not save address.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ---- Step 2: GPS confirm ----
  async function handleGpsContinue() {
    if (!form.coords) return showToast("Please use GPS or tap the map to set a location.", "error");
    setSaving(true);
    try {
      const updated = await DeliveryPointsAPI.update(pointId, {
        latitude: form.coords.lat,
        longitude: form.coords.lng,
        gpsConfirmed: true,
      });
      setLive(updated);
      setStep(3);
    } catch (err) {
      showToast(err.response?.data?.error || "Could not save location.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ---- Step 3: exact pin ----
  async function handlePinContinue() {
    setSaving(true);
    try {
      const updated = await DeliveryPointsAPI.update(pointId, {
        latitude: form.coords.lat,
        longitude: form.coords.lng,
        pinPlaced: true,
      });
      setLive(updated);
      setStep(4);
    } catch (err) {
      showToast(err.response?.data?.error || "Could not confirm pin.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ---- Step 4: building context ----
  async function handleBuildingContinue(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await DeliveryPointsAPI.update(pointId, {
        towerBlock: form.towerBlock,
        floorNumber: form.floorNumber,
        flatNumber: form.flatNumber,
        gateEntrance: form.gateEntrance,
        landmark: form.landmark,
        deliveryInstructions: form.deliveryInstructions,
      });
      setLive(updated);
      setStep(5);
    } catch (err) {
      showToast(err.response?.data?.error || "Could not save building details.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ---- Step 5: photo ----
  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handlePhotoUpload() {
    if (!photoFile) return showToast("Please choose a photo first.", "error");
    setSaving(true);
    try {
      const updated = await DeliveryPointsAPI.uploadPhoto(pointId, photoFile);
      setLive(updated);
      showToast("Entrance photo uploaded!");
    } catch (err) {
      showToast(err.response?.data?.error || "Photo upload failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  function finish() {
    navigate(`/points/${pointId}`);
  }

  return (
    <div className="page">
      <div className="container">
        <p className="eyebrow">Create a Delivery Point</p>
        <h1 className="page-title">Turn Your Address Into a Verified Delivery Point</h1>
        <p className="page-subtitle">
          Follow the steps below. Each step raises your Location Confidence Score, helping riders find your door
          without guesswork or phone calls.
        </p>

        <Stepper current={step} />

        <div className="grid grid-2" style={{ alignItems: "start" }}>
          <div className="card">
            {step === 1 && (
              <form onSubmit={handleCreate}>
                <h3 style={{ marginTop: 0 }}>Step 1 · Enter Your Address</h3>
                <div className="field">
                  <label>Delivery Address</label>
                  <textarea
                    placeholder="e.g. D-4H, Sikraul, Prayagraj, Uttar Pradesh"
                    value={form.addressText}
                    onChange={(e) => set("addressText", e.target.value)}
                    required
                  />
                </div>
                <div className="row-2">
                  <div className="field">
                    <label>Your Name (optional)</label>
                    <input type="text" value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Phone (optional)</label>
                    <input type="tel" value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} />
                  </div>
                </div>
                <button className="btn btn-primary btn-block" disabled={saving}>
                  {saving ? "Saving..." : "Continue →"}
                </button>
              </form>
            )}

            {step === 2 && (
              <div>
                <h3 style={{ marginTop: 0 }}>Step 2 · Confirm GPS Location</h3>
                <p className="hint" style={{ marginTop: -8, marginBottom: 14 }}>
                  Tap "Use My Current Location" so we know the general building cluster.
                </p>
                <MapPicker value={form.coords} onChange={(lat, lng) => set("coords", { lat, lng })} />
                <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={handleGpsContinue} disabled={saving}>
                  {saving ? "Saving..." : "Confirm GPS & Continue →"}
                </button>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 style={{ marginTop: 0 }}>Step 3 · Place the Exact Entrance Pin</h3>
                <p className="hint" style={{ marginTop: -8, marginBottom: 14 }}>
                  Fine-tune the marker by tapping exactly on your gate or door — not just the building block.
                </p>
                <MapPicker value={form.coords} onChange={(lat, lng) => set("coords", { lat, lng })} />
                <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={handlePinContinue} disabled={saving}>
                  {saving ? "Saving..." : "Confirm Exact Pin & Continue →"}
                </button>
              </div>
            )}

            {step === 4 && (
              <form onSubmit={handleBuildingContinue}>
                <h3 style={{ marginTop: 0 }}>Step 4 · Building & Entrance Context</h3>
                <div className="row-2">
                  <div className="field">
                    <label>Tower / Block</label>
                    <input type="text" placeholder="e.g. Block D" value={form.towerBlock} onChange={(e) => set("towerBlock", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Floor</label>
                    <input type="text" placeholder="e.g. 3rd Floor" value={form.floorNumber} onChange={(e) => set("floorNumber", e.target.value)} />
                  </div>
                </div>
                <div className="row-2">
                  <div className="field">
                    <label>Flat / House No.</label>
                    <input type="text" placeholder="e.g. Flat 302" value={form.flatNumber} onChange={(e) => set("flatNumber", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Gate / Entrance</label>
                    <input type="text" placeholder="e.g. Gate 2 (Near ATM)" value={form.gateEntrance} onChange={(e) => set("gateEntrance", e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>Landmark</label>
                  <input type="text" placeholder="e.g. Opposite SBI ATM" value={form.landmark} onChange={(e) => set("landmark", e.target.value)} />
                </div>
                <div className="field">
                  <label>Delivery Instructions (optional)</label>
                  <textarea placeholder="e.g. Ring the bell twice, dog on premises is friendly" value={form.deliveryInstructions} onChange={(e) => set("deliveryInstructions", e.target.value)} />
                </div>
                <button className="btn btn-primary btn-block" disabled={saving}>
                  {saving ? "Saving..." : "Save Details & Continue →"}
                </button>
              </form>
            )}

            {step === 5 && (
              <div>
                <h3 style={{ marginTop: 0 }}>Step 5 · Add Entrance Photo Evidence</h3>
                <p className="hint" style={{ marginTop: -8, marginBottom: 14 }}>
                  A photo of your gate or door lets the rider recognise it instantly — this pushes your score to
                  the highest tier.
                </p>
                <div className="field">
                  <input type="file" accept="image/*" onChange={handlePhotoChange} />
                </div>
                {photoPreview && (
                  <div className="rider-photo-box" style={{ marginBottom: 14 }}>
                    <img src={photoPreview} alt="Entrance preview" />
                  </div>
                )}
                <button className="btn btn-secondary btn-block" onClick={handlePhotoUpload} disabled={saving || !photoFile} style={{ marginBottom: 10 }}>
                  {saving ? "Uploading..." : "Upload Photo"}
                </button>
                <button className="btn btn-primary btn-block" onClick={finish}>
                  Finish → View Verified Delivery Point
                </button>
              </div>
            )}
          </div>

          <div>
            <h3 style={{ marginTop: 0, color: "#0b1f3a" }}>Live Location Confidence Score</h3>
            {live ? (
              <ConfidenceMeter score={live.confidenceScore} label={live.confidenceLabel} breakdown={live.confidenceBreakdown} />
            ) : (
              <div className="card empty-state">Fill in Step 1 to start building your score.</div>
            )}
          </div>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </div>
  );
}
