import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

const app = express();
const server = http.createServer(app);
app.use(cors({ origin: "*" }));

dotenv.config();

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["POST", "GET"],
  },
});

const rooms = {};
const peers = {};

const ADMIN_PASSWORD = process.env.PASSWORD;

io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // handle admin login
  socket.on("adminLogin", (data) => {
    const password = data.password;

    if (password === ADMIN_PASSWORD) {
      socket.emit("loginResult", { success: true });
    } else socket.emit("loginResult", { success: false });
  });

  socket.on("joinRoom", ({ room, name }) => {
    socket.join(room);
    console.log(`User ${name} joined room ${room}`);

    // add client to the room
    if (!rooms[room]) {
      rooms[room] = { clients: [], videoId: null };
    }

    rooms[room].clients.push({ socketId: socket.id, name });

    // Sync existing video state if it exists
    if (rooms[room]) {
      socket.emit("syncVideo", rooms[room]); // Sync existing video state
    }

    socket
      .to(room)
      .emit("message", { message: `${name} has joined the room`, name });
  });

  socket.on("sendId", (data) => {
    const id = data.id;
    peers[socket.id] = id;
    console.log("Peer id :", id);
    socket.broadcast.emit("newPeer", id);
  });

  socket.on("playVideo", (data) => {
    const { room, time } = data;
    console.log("Play video", data);
    rooms[room] = { ...rooms[room], playing: true, time };
    socket.to(room).emit("playVideo", { time }); // Emit only time
  });

  socket.on("pauseVideo", (data) => {
    const { room, time } = data;
    console.log("Pause video", data);
    rooms[room] = { ...rooms[room], playing: false, time };
    socket.to(room).emit("pauseVideo", { time }); // Emit only time
  });

  socket.on("seekVideo", (data) => {
    const { room, time } = data;
    console.log("Seek Video", data);
    rooms[room] = { ...rooms[room], time };
    socket.to(room).emit("seekVideo", { time }); // Emit only time
  });

  socket.on("videoSwitch", (data) => {
    const { videoId, room } = data;

    rooms[room] = { ...rooms[room], videoId };
    socket.to(room).emit("videoSwitched", { videoId, room });
  });

  socket.on("getRoomInfo", () => {
    socket.emit("roomInfo", rooms);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");

    // Remove user from rooms and peers
    for (let room in rooms) {
      rooms[room].clients = rooms[room].clients.filter(
        (client) => client.socketId !== socket.id
      );
      if (rooms[room].clients.length === 0) {
        delete rooms[room]; // Clean up room if empty
      }
    }
    delete peers[socket.id];
  });
});

app.get("/", (req, res) => {
  res.send("Hello");
});

const port = 8000;

server.listen(port, () => {
  console.log(`App listening at port ${port}`);
});
