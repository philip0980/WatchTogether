import React, { useEffect, useRef } from "react";
import YouTube from "react-youtube";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";

const Video = () => {
  const player = useRef(null);
  const socket = useRef(null);
  const location = useLocation();
  const { room } = location.state;
  const lastEmittedTime = useRef({ play: null, pause: null, seek: null });

  useEffect(() => {
    socket.current = io("http://localhost:8000");

    socket.current.on("connect", () => {
      console.log(`Connected to server with socket id: ${socket.current.id}`);
      socket.current.emit("joinRoom", { room, name: "User" }); // Change "User" to the actual user name
    });

    socket.current.on("syncVideo", (data) => {
      if (player.current) {
        const currentTime = player.current.getCurrentTime();
        if (Math.abs(currentTime - data.time) > 0.5) {
          player.current.seekTo(data.time);
        }
        if (data.playing) {
          player.current.playVideo();
        } else {
          player.current.pauseVideo();
        }
      }
    });

    socket.current.on("playVideo", (data) => {
      if (player.current && player.current.getPlayerState() !== 1) {
        player.current.seekTo(data.time);
        player.current.playVideo();
      }
    });

    socket.current.on("pauseVideo", (data) => {
      if (player.current && player.current.getPlayerState() !== 2) {
        player.current.seekTo(data.time);
        player.current.pauseVideo();
      }
    });

    socket.current.on("seekVideo", (data) => {
      if (player.current) {
        player.current.seekTo(data.time);
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, [room]);

  const opts = {
    playerVars: {
      autoplay: 1,
    },
  };

  const onPlay = () => {
    const currentTime = player.current.getCurrentTime();
    const now = Date.now();

    if (
      !lastEmittedTime.current.play ||
      now - lastEmittedTime.current.play > 1000
    ) {
      socket.current.emit("playVideo", { time: currentTime, room });
      lastEmittedTime.current.play = now;
    }
  };

  const onPause = () => {
    const currentTime = player.current.getCurrentTime();
    const now = Date.now();

    if (
      !lastEmittedTime.current.pause ||
      now - lastEmittedTime.current.pause > 1000
    ) {
      socket.current.emit("pauseVideo", { time: currentTime, room });
      lastEmittedTime.current.pause = now;
    }
  };

  const onStateChange = (event) => {
    if (event.data === 0) {
      if (player.current) {
        player.current.seekTo(0);
        player.current.playVideo();
      }
    }

    // Emit seek event only for significant state changes
    const currentTime = player.current.getCurrentTime();
    const now = Date.now();

    if (event.data === 1 || event.data === 2) {
      if (
        !lastEmittedTime.current.seek ||
        now - lastEmittedTime.current.seek > 1000
      ) {
        socket.current.emit("seekVideo", { time: currentTime, room });
        lastEmittedTime.current.seek = now;
      }
    }
  };

  return (
    <div>
      <YouTube
        videoId="NDjeeJwI08Q"
        onPlay={onPlay}
        onPause={onPause}
        onStateChange={onStateChange}
        onReady={(event) => {
          player.current = event.target;
        }}
        opts={opts}
      />
    </div>
  );
};

export default Video;
