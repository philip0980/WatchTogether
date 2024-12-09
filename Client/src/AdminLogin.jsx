import React, { useState } from "react";
import { io } from "socket.io-client";
import Dashboard from "./Dashboard";
import "./AdminLogin.css";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const socket = io("http://localhost:8000");

    socket.emit("adminLogin", { password });

    socket.on("loginResult", (result) => {
      if (result.success) {
        setIsAuthenticated(true);
        setError("");
      } else {
        setError("Invalid password , please try again");
      }
    });
  };

  return (
    <div>
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <div className="up_container">
          <div className="border_container">
            <h1>AdminLogin</h1>
            <input
              type="password"
              value={password}
              placeholder="Enter password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
