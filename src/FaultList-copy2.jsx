import { useState, useEffect } from "react";
import axios from "axios";

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
    if (isNaN(parsed)) {
      return { color: "black" };
    }
    if (parsed < 4) {
      return { color: "green" };
    }
    if (parsed < 8) {
      return { color: "orange" };
    }
    return { color: "red", fontWeight: "bold" };
  };

  const parseHandoverDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    return new Date(dateStr);
  };

  // 🟢 Form Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({});
    setShowForm(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    if (!window.confirm("Are you sure to delete?")) return;
    setFaults((prev) => prev.filter((f) => f.id !== item.id));
    // Later: call backend to actually delete
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      // Update
      setFaults((prev) =>
        prev.map((f) =>
          f.id === editingItem.id ? { ...editingItem, ...formData } : f
        )
      );
    } else {
      // Add new (temporary ID)
      const newId = Math.max(0, ...faults.map((f) => f.id || 0)) + 1;
      setFaults((prev) => [...prev, { ...formData, id: newId }]);
    }
    setShowForm(false);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Fault Report List</h2>

      <button onClick={handleOpenAdd} style={{ marginBottom: "1rem" }}>
        ➕ Add Fault
      </button>

      {loading && <p>Loading...</p>}

      {showForm && (
        <div
          style={{
            border: "2px solid #333",
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "8px",
            background: "#f9f9f9",
          }}
        >
          <h3>{editingItem ? "Edit Fault" : "Add Fault"}</h3>
          <form onSubmit={handleFormSubmit}>
            <input
              type="text"
              name="Route name as per Transnet (from Point A to B)"
              placeholder="Route Name"
              value={
                formData["Route name as per Transnet (from Point A to B)"] || ""
              }
              onChange={handleFormChange}
              required
            />
            <br />
            <input
              type="text"
              name="Status of fault(carried forward/ restored)"
              placeholder="Status (Carried Forwarded/Restored)"
              value={
                formData["Status of fault(carried forward/ restored)"] || ""
              }
              onChange={handleFormChange}
              required
            />
            <br />
            <input
              type="text"
              name="Date & Time of Handover of fault"
              placeholder="Handover Date & Time"
              value={formData["Date & Time of Handover of fault"] || ""}
              onChange={handleFormChange}
              required
            />
            <br />
            <input
              type="text"
              name="Fault durration"
              placeholder="Fault Duration"
              value={formData["Fault durration"] || ""}
              onChange={handleFormChange}
              required
            />
            <br />
            <br />
            <button type="submit">💾 Save</button>{" "}
            <button type="button" onClick={() => setShowForm(false)}>
              ❌ Cancel
            </button>
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

        const sorted = [...carried, ...restored];

        return sorted.map((item) => {
          const duration = item["Fault durration"];
          const handoverTime = item["Date & Time of Handover of fault"];
          const routeName =
            item["Route name as per Transnet (from Point A to B)"];
          const status = item["Status of fault(carried forward/ restored)"];
          const colorStyle = getColorStyle(duration);

          return (
            <div
              key={item.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                marginBottom: "1rem",
                padding: "1rem",
              }}
            >
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
              <button onClick={() => handleOpenEdit(item)}>✏️ Edit</button>{" "}
              <button onClick={() => handleDelete(item)}>🗑️ Delete</button>
            </div>
          );
        });
      })()}
    </div>
  );
}
