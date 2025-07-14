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

  const handleDelete = (item) => {
    if (!window.confirm("Are you sure to delete?")) return;
    setFaults((prev) => prev.filter((f) => f.id !== item.id));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields only
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].toString().trim() === "") {
        alert(`Please fill in the required field: ${field}`);
        return;
      }
    }

    const token = localStorage.getItem("token");

    try {
      if (editingItem) {
        await axios.post(WEB_APP_URL, {
          action: "update",
          token,
          id: editingItem.id,
          data: formData,
        });
      } else {
        await axios.post(WEB_APP_URL, {
          action: "add",
          token,
          data: formData,
        });
      }

      // Refresh
      const res = await axios.get(
        `${WEB_APP_URL}?action=readEditable&token=${encodeURIComponent(token)}`
      );
      if (res.data.success) {
        setFaults(res.data.data);
      } else {
        alert("Failed to reload data after save");
      }

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
      </div>

      {loading && <p style={{ textAlign: "center" }}>Loading...</p>}

      {showForm && (
        <div className="fault-form">
          <h3>{editingItem ? "Edit Fault" : "Add Fault"}</h3>
          <form onSubmit={handleFormSubmit}>
            {/* Always show these 3 datetime fields first */}
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

      {/* Display Fault Cards */}
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
              <div className="fault-card-content">
                <div className="fault-card-column">
                  <p>
                    <strong>Status:</strong> {status}
                  </p>
                  <p>
                    <strong>Fault Duration:</strong>{" "}
                    <span style={colorStyle}>{duration} hrs</span>
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
