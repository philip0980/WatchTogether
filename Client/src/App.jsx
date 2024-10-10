import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Video from "./Video";
import Home from "./Home";
import Dashboard from "./Dashboard";
import AdminLogin from "./AdminLogin";

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:room/video" element={<Video />} />
          {/* <Route path="/admin/dashboard" element={<Dashboard />} /> */}
          <Route path="/admin" element={<AdminLogin />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
