import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Video from "./Video";
import Home from "./Home";

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:room/video" element={<Video />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
