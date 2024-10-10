import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import YouTube from "react-youtube";

const Dashboard = () => {
  const [rooms, setRooms] = useState({});

  useEffect(() => {
    const socket = io("http://localhost:8000");

    socket.emit("getRoomInfo");

    socket.on("roomInfo", (data) => {
      setRooms(data);
      console.log("room data :", data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>Rooms and Clients</h2>
      {Object.keys(rooms).length > 0 ? (
        <div>
          {Object.entries(rooms).map(([roomName, roomData]) => (
            <div key={roomName}>
              <h3>Room: {roomName}</h3>
              <p>
                Playing: {roomData.playing ? "Yes" : "No"}, Time:{" "}
                {roomData.time}s
              </p>
              <p>Currently playing video ID: {roomData.videoId}</p>
              <YouTube videoId={roomData.videoId} />
              <h4>Clients:</h4>
              <ul>
                {roomData.clients.map((client) => (
                  <li key={client.socketId}>
                    {client.name} (ID: {client.socketId})
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p>No active rooms</p>
      )}
    </div>
  );
};

export default Dashboard;
