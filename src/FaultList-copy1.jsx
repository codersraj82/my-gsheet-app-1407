import { useState, useEffect } from "react";
import axios from "axios";

const WEB_APP_URL = "/api";

export default function FaultList() {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Fault Report List</h2>
      {loading && <p>Loading...</p>}

      {(() => {
        // Filter out rows with no route name
        const filtered = faults.filter((item) => {
          const routeName =
            item["Route name as per Transnet (from Point A to B)"];
          return routeName && routeName.trim() !== "";
        });

        // Split into Carried Forwarded and Restored
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

        // Sort carried oldest→newest
        carried.sort(
          (a, b) =>
            parseHandoverDate(a["Date & Time of Handover of fault"]) -
            parseHandoverDate(b["Date & Time of Handover of fault"])
        );

        // Sort restored newest→oldest
        restored.sort(
          (a, b) =>
            parseHandoverDate(b["Date & Time of Handover of fault"]) -
            parseHandoverDate(a["Date & Time of Handover of fault"])
        );

        // Combine
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
            </div>
          );
        });
      })()}
    </div>
  );
}
