import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
app.use(cors({ origin: "http://localhost:5173" }));

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["POST", "GET"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.on("joinRoom", ({ room, name }) => {
    socket.join(room);
    console.log(`User ${name} joined room ${room}`);

    if (rooms[room]) {
      socket.emit("syncVideo", rooms[room]); // Sync existing video state
    }

    socket.to(room).emit("message", `${name} has joined the room`);
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

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.get("/", (req, res) => {
  res.send("Hello");
});

const port = 8000;

server.listen(port, () => {
  console.log(`App listening at port ${port}`);
});
