import { useState, useEffect } from "react";
import axios from "axios";
import "./FaultList.css";

const WEB_APP_URL = "/api";

export default function FaultList() {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(
        `${WEB_APP_URL}?action=readEditable&token=${encodeURIComponent(token)}`
      )
      .then((res) => {
        if (res.data.success) {
          setFaults(res.data.data);
        } else {
          alert("Failed to load data");
        }
      })
      .catch(() => alert("Error contacting server"))
      .finally(() => setLoading(false));
  }, []);

  const getColorStyle = (durationStr) => {
    const parsed = parseFloat(durationStr);
    if (isNaN(parsed)) return { color: "black" };
    if (parsed < 4) return { color: "green" };
    if (parsed < 8) return { color: "orange" };
    return { color: "red", fontWeight: "bold" };
  };

  const parseHandoverDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    return new Date(dateStr);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({});
    setShowForm(true);
  };

  const handleOpenEdit = (item) => {
    const copy = { ...item };
    delete copy["Fault durration"];
    setEditingItem(item);
    setFormData(copy);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    if (!window.confirm("Are you sure to delete?")) return;
    setFaults((prev) => prev.filter((f) => f.id !== item.id));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      setFaults((prev) =>
        prev.map((f) =>
          f.id === editingItem.id ? { ...editingItem, ...formData } : f
        )
      );
    } else {
      const newId = Math.max(0, ...faults.map((f) => f.id || 0)) + 1;
      setFaults((prev) => [...prev, { ...formData, id: newId }]);
    }
    setShowForm(false);
  };

  const editableFields = () => {
    if (!faults.length) return [];
    const headers = Object.keys(faults[0]);
    return headers.filter(
      (h) =>
        h !== "id" &&
        h.trim().toLowerCase() !== "fault durration" &&
        h.trim() !== ""
    );
  };

  const buttonStyle = {
    padding: "0.5rem 1rem",
    margin: "0.25rem",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "white",
    fontWeight: "bold",
  };

  const buttonDanger = {
    ...buttonStyle,
    backgroundColor: "#dc3545",
  };

  const buttonSecondary = {
    ...buttonStyle,
    backgroundColor: "#6c757d",
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>Fault Report List</h2>

      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <button style={buttonStyle} onClick={handleOpenAdd}>
          ➕ Add Fault
        </button>
      </div>

      {loading && <p style={{ textAlign: "center" }}>Loading...</p>}

      {showForm && (
        <div className="fault-form">
          <h3>{editingItem ? "Edit Fault" : "Add Fault"}</h3>
          <form onSubmit={handleFormSubmit}>
            {editableFields().map((field) => (
              <div key={field}>
                <label>{field}</label>
                <input
                  type="text"
                  name={field}
                  value={formData[field] || ""}
                  onChange={handleFormChange}
                  required
                />
              </div>
            ))}
            <div className="fault-form-buttons">
              <button type="submit" className="fault-button">
                💾 Save
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="fault-button fault-button-secondary"
              >
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {(() => {
        const filtered = faults.filter((item) => {
          const routeName =
            item["Route name as per Transnet (from Point A to B)"];
          return routeName && routeName.trim() !== "";
        });

        const carried = filtered.filter((item) =>
          (item["Status of fault(carried forward/ restored)"] || "")
            .toLowerCase()
            .startsWith("carried")
        );

        const restored = filtered.filter((item) =>
          (item["Status of fault(carried forward/ restored)"] || "")
            .toLowerCase()
            .startsWith("restored")
        );

        carried.sort(
          (a, b) =>
            parseHandoverDate(a["Date & Time of Handover of fault"]) -
            parseHandoverDate(b["Date & Time of Handover of fault"])
        );

        restored.sort(
          (a, b) =>
            parseHandoverDate(b["Date & Time of Handover of fault"]) -
            parseHandoverDate(a["Date & Time of Handover of fault"])
        );

        const sorted = [...carried, ...restored];

        return sorted.map((item) => {
          const duration = item["Fault durration"];
          const handoverTime = item["Date & Time of Handover of fault"];
          const routeName =
            item["Route name as per Transnet (from Point A to B)"];
          const status = item["Status of fault(carried forward/ restored)"];
          const colorStyle = getColorStyle(duration);

          return (
            <div key={item.id} className="fault-card">
              <h3 style={colorStyle}>{routeName}</h3>
              <p>
                <strong>Status of fault:</strong> {status}
              </p>
              <p>
                <strong>Handover Date & Time:</strong> {handoverTime}
              </p>
              <p>
                <strong>Fault Duration:</strong>{" "}
                <span style={colorStyle}>{duration} hrs</span>
              </p>
              <div className="fault-card-buttons">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="fault-button"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="fault-button fault-button-secondary"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
}
