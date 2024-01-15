import React, { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRute/PrivateRoute";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("isLoggedIn") ?? false);
  return (
    <div style={{ padding: "10px" }}>
      <h1>Welcome to GupShupIndia</h1>

      <Router>
        <Routes>
        <Route path="/" element={<Login  setIsAuthenticated={setIsAuthenticated}/>} />
          <Route path="/login" element={<Login  setIsAuthenticated={setIsAuthenticated}/>} />
          <Route path="/register" element={<Register />} />

          {isAuthenticated && <Route path="/chat" element={<Chat />} />}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
