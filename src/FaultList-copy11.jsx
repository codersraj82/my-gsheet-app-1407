import { useState, useEffect } from "react";
import axios from "axios";
import "./FaultList.css";
import Select from "react-select";
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";
import moment from "moment";
import "moment/locale/en-gb";

moment.locale("en-gb");
const WEB_APP_URL = "/api";

export default function FaultList() {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [routes, setRoutes] = useState([]);

  // Always-required date-time fields
  const dateTimeFields = [
    "Fault in Date & Time",
    "Date & Time of fault clearance",
    "Date & Time of Handover of fault",
  ];

  const requiredFields = [
    "Route name as per Transnet (from Point A to B)",
    "Status of fault(carried forward/ restored)",
    "Date & Time of Handover of fault",
  ];

  const formatDurationHHMM = (value) => {
    if (!value) return "";

    // Case 1: already in HH:MM:SS or HH:MM
    if (value.includes(":")) {
      const parts = value.split(":");
      const hours = parts[0].padStart(2, "0");
      const minutes = parts[1] ? parts[1].padStart(2, "0") : "00";
      return `${hours}:${minutes}`;
    }

    // Case 2: decimal hours like 4.25
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      const hours = Math.floor(parsed);
      const minutes = Math.round((parsed - hours) * 60);
      return `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
    }

    return value;
  };

  // Fetch editable data
  const loadEditableData = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `${WEB_APP_URL}?action=readEditable&token=${encodeURIComponent(token)}`
    );
    if (res.data.success) {
      setFaults(res.data.data);
    } else {
      alert("Failed to load data");
    }
  };

  useEffect(() => {
    loadEditableData().finally(() => setLoading(false));
  }, []);

  // Fetch fixed data (routes)
  useEffect(() => {
    axios
      .get(`${WEB_APP_URL}?action=readFixed`)
      .then((res) => {
        if (res.data.success) {
          setRoutes(res.data.data);
        } else {
          console.error("Failed to load route details");
        }
      })
      .catch(() => console.error("Error contacting server for routes"));
  }, []);

  const getRouteOptions = () =>
    routes
      .filter(
        (route) => route["Route name as per Transnet (from Point A to B)"]
      )
      .map((route) => ({
        value: route["Route name as per Transnet (from Point A to B)"],
        label: route["Route name as per Transnet (from Point A to B)"],
      }));

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

  const handleDelete = async (item) => {
    if (!window.confirm("Are you sure to delete?")) return;

    const token = localStorage.getItem("token");

    try {
      await axios.post(WEB_APP_URL, {
        action: "delete",
        token,
        id: item.id,
      });

      // 🟢 REFRESH LIST FROM SERVER to get correct IDs
      const res = await axios.get(
        `${WEB_APP_URL}?action=readEditable&token=${encodeURIComponent(token)}`
      );
      if (res.data.success) {
        setFaults(res.data.data);
      } else {
        alert("Failed to reload data after delete");
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete item");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Check required fields
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].toString().trim() === "") {
        alert(`Please fill in the required field: ${field}`);
        return;
      }
    }

    // Convert date-time fields to ISO format
    const processedData = { ...formData };

    // dateTimeFields.forEach((field) => {
    //   if (processedData[field]) {
    //     const parsed = moment(processedData[field], "DD/MM/YYYY HH:mm", true);
    //     processedData[field] = parsed.isValid()
    //       ? parsed.toISOString()
    //       : processedData[field];
    //   }
    // });

    const token = localStorage.getItem("token");
    try {
      if (editingItem) {
        await axios.post(WEB_APP_URL, {
          action: "update",
          token,
          id: editingItem.id,
          data: processedData,
        });
      } else {
        await axios.post(WEB_APP_URL, {
          action: "create",
          token,
          data: processedData,
        });
      }

      // Refresh list from Google Sheets
      await loadEditableData();

      setShowForm(false);
    } catch (err) {
      console.error("Error saving to server", err);
      alert("Error saving to server");
    }
  };

  const allEditableFields = () => {
    if (!faults.length) return [];
    const headers = Object.keys(faults[0]);
    return headers.filter(
      (h) =>
        h !== "id" &&
        h.trim().toLowerCase() !== "fault durration" &&
        h.trim() !== ""
    );
  };

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

  const selectCustomStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "#222",
      borderColor: "#555",
      color: "#fff",
      minHeight: "40px",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#fff",
    }),
    input: (base) => ({
      ...base,
      color: "#fff",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#222",
      color: "#fff",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#444" : "#222",
      color: "#fff",
      cursor: "pointer",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#aaa",
    }),
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>Fault Report List</h2>

      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <button style={buttonStyle} onClick={handleOpenAdd}>
          ➕ Add Fault
        </button>
        <button
          style={{ ...buttonStyle, backgroundColor: "#28a745" }}
          onClick={async () => {
            setLoading(true);
            await loadEditableData();
            setLoading(false);
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading && <p style={{ textAlign: "center" }}>Loading...</p>}

      {showForm && (
        <div className="fault-form">
          <h3>{editingItem ? "Edit Fault" : "Add Fault"}</h3>
          <form onSubmit={handleFormSubmit}>
            {dateTimeFields.map((field) => (
              <div key={field}>
                <label>
                  {field}
                  {requiredFields.includes(field) && (
                    <span style={{ color: "red" }}> *</span>
                  )}
                </label>
                <Datetime
                  value={formData[field] || ""}
                  onChange={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field]:
                        date && date.format
                          ? date.format("DD/MM/YYYY HH:mm")
                          : date,
                    }))
                  }
                  dateFormat="DD/MM/YYYY"
                  timeFormat="HH:mm"
                  inputProps={{
                    placeholder: `Select ${field}`,
                    style: {
                      backgroundColor: "#222",
                      color: "#333",
                      border: "1px solid #555",
                      padding: "8px",
                      borderRadius: "4px",
                    },
                  }}
                />
              </div>
            ))}

            {allEditableFields()
              .filter((field) => !dateTimeFields.includes(field))
              .map((field) => (
                <div key={field}>
                  <label>
                    {field}
                    {requiredFields.includes(field) && (
                      <span style={{ color: "red" }}> *</span>
                    )}
                  </label>
                  {field ===
                  "Route name as per Transnet (from Point A to B)" ? (
                    <Select
                      className="route-dropdown"
                      classNamePrefix="route-dropdown"
                      styles={selectCustomStyles}
                      options={getRouteOptions()}
                      value={
                        formData[field]
                          ? { value: formData[field], label: formData[field] }
                          : null
                      }
                      onChange={(selected) =>
                        handleFormChange({
                          target: {
                            name: field,
                            value: selected ? selected.value : "",
                          },
                        })
                      }
                      placeholder="Select or search Route Name"
                      isClearable
                    />
                  ) : field === "Status of fault(carried forward/ restored)" ? (
                    <Select
                      className="status-dropdown"
                      classNamePrefix="status-dropdown"
                      styles={selectCustomStyles}
                      options={[
                        {
                          value: "Carried Forwarded",
                          label: "Carried Forwarded",
                        },
                        { value: "Restored", label: "Restored" },
                      ]}
                      value={
                        formData[field]
                          ? { value: formData[field], label: formData[field] }
                          : null
                      }
                      onChange={(selected) =>
                        handleFormChange({
                          target: {
                            name: field,
                            value: selected ? selected.value : "",
                          },
                        })
                      }
                      placeholder="Select Status"
                      isClearable
                    />
                  ) : (
                    <input
                      type="text"
                      name={field}
                      value={formData[field] || ""}
                      onChange={handleFormChange}
                    />
                  )}
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
          console.log(duration);
          const handoverTime = item["Date & Time of Handover of fault"];
          const routeName =
            item["Route name as per Transnet (from Point A to B)"];
          const status = item["Status of fault(carried forward/ restored)"];
          const colorStyle = getColorStyle(duration);

          return (
            <div key={item.id} className="fault-card">
              <h3 style={colorStyle}>{routeName}</h3>
              <div className="fault-card-content">
                <div className="fault-card-column">
                  <p>
                    <strong>Status:</strong> {status}
                  </p>
                  <p>
                    <strong>Fault Duration:</strong>{" "}
                    <span style={colorStyle}>{duration}</span>
                  </p>
                </div>
                <div className="fault-card-column">
                  <p>
                    <strong>Handover Date & Time:</strong> {handoverTime}
                  </p>
                </div>
              </div>
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
