import { useState } from "react";
import axios from "axios";

const WEB_APP_URL = "/api";

function Login({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(WEB_APP_URL, {
        action: "login",
        username,
        password,
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        setToken(response.data.token);
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err) {
      setError("Error contacting server");
    }
  };

  return (
    <div
      style={{
        maxWidth: "300px",
        margin: "2rem auto",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
        </div>
        <button type="submit" style={{ width: "100%" }}>
          Login
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}
    </div>
  );
}

export default Login;
