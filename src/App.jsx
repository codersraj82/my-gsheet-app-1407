import { useState } from "react";
import "./App.css";
import Login from "./Login";
import FaultList from "./FaultList";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  return (
    <div className="App">
      {!token ? (
        <Login setToken={setToken} />
      ) : (
        <div>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              setToken("");
            }}
          >
            Logout
          </button>
          <div>
            <FaultList />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
