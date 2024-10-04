import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const Home = () => {
  const [room, setRoom] = useState("");
  const [name, setName] = useState("");
  const socket = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    socket.current = io("http://localhost:8000");

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const handleJoin = () => {
    if (room && name) {
      socket.current.emit("joinRoom", { room, name });
      navigate(`/${room}/video`, { state: { room } });
    } else {
      alert("Please enter both name and room");
    }
  };
  return (
    <div>
      <input
        type="text"
        placeholder="Username"
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter room name"
        onChange={(e) => setRoom(e.target.value)}
      />
      <button onClick={handleJoin}>Create Room</button>
    </div>
  );
};

export default Home;
