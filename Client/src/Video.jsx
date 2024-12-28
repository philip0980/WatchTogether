import React, { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Peer } from "peerjs";
import "./Video.css";

const Video = () => {
  const [query, setQuery] = useState("");
  const [videoes, setVideoes] = useState([]);
  const [mainVideoId, setMainVideoId] = useState("NDjeeJwI08Q");
  const [peerId, setPeerId] = useState("");
  const [oppPeerId, setOppPeerId] = useState("");
  const [oppName, setOppName] = useState("");
  const [namee, setNamee] = useState("");
  const [localStream, setLocalStream] = useState("");
  const [remoteStream, setRemoteStream] = useState("");
  const player = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const location = useLocation();
  const { room, name } = location.state;
  const lastEmittedTime = useRef({ play: null, pause: null, seek: null });

  const fetchVideoes = async (searchQuery) => {
    const key = "*";
    const API = `https://www.googleapis.com/youtube/v3/search?key=${key}&part=snippet&type=video&q=${searchQuery}`;
    try {
      const response = await axios.get(API);
      if (response.data.items.length > 0) {
        setMainVideoId(response.data.items[0].id.videoId);
      }
      console.log(response.data.items);
      setVideoes(response.data.items);
    } catch (error) {
      console.log("Error fetching videoes", error);
    }
  };

  useEffect(() => {
    fetchVideoes(query);
  }, []);

  useEffect(() => {
    socketRef.current = io("http://localhost:8000");

    socketRef.current.on("connect", () => {
      console.log(
        `Connected to server with socketRef id: ${socketRef.current.id}`
      );
      socketRef.current.emit("joinRoom", { room, name });
      setNamee(name);
    });

    socketRef.current.on("newPeer", (id) => {
      setOppPeerId(id);
      console.log("New peer connected", id);
    });

    socketRef.current.on("message", (data) => {
      const { message, name } = data;
      console.log(message);
      setOppName(name);
    });

    socketRef.current.on("syncVideo", (data) => {
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

    socketRef.current.on("playVideo", (data) => {
      if (player.current && player.current.getPlayerState() !== 1) {
        player.current.seekTo(data.time);
        player.current.playVideo();
      }
    });

    socketRef.current.on("pauseVideo", (data) => {
      if (player.current && player.current.getPlayerState() !== 2) {
        player.current.seekTo(data.time);
        player.current.pauseVideo();
      }
    });

    socketRef.current.on("seekVideo", (data) => {
      if (player.current) {
        player.current.seekTo(data.time);
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const opts = {
    playerVars: {
      autoplay: 0,
    },
  };

  const onPlay = () => {
    const currentTime = player.current.getCurrentTime();
    const now = Date.now();

    if (
      !lastEmittedTime.current.play ||
      now - lastEmittedTime.current.play > 1000
    ) {
      socketRef.current.emit("playVideo", { time: currentTime, room });
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
      socketRef.current.emit("pauseVideo", { time: currentTime, room });
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
        socketRef.current.emit("seekVideo", { time: currentTime, room });
        lastEmittedTime.current.seek = now;
      }
    }
  };

  const handleSearch = () => {
    if (!query) return;
    fetchVideoes(query);
  };

  useEffect(() => {
    if (player.current) {
      player.current.loadVideoById(mainVideoId); // Load new video
    }
  }, [mainVideoId]);

  const handleVideoSwitch = (videoId) => {
    setMainVideoId(videoId);
    socketRef.current.emit("videoSwitch", { room, videoId });
  };

  useEffect(() => {
    const handleVideoSwitch = (data) => {
      if (data.videoId && data.room === room) {
        setMainVideoId(data.videoId);
        if (player.current) {
          player.current.loadVideoById(data.videoId);
        }
      }
    };

    socketRef.current.on("videoSwitched", handleVideoSwitch);

    return () => {
      socketRef.current.off("videoSwitched", handleVideoSwitch);
    };
  }, []);

  // VideoCalling feature

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
      const socket = socketRef.current;
      socket.emit("sendId", { id });
    });

    peer.on("call", (call) => {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        setLocalStream(stream);
        call.answer(stream);

        call.on("stream", (remoteStream) => {
          setRemoteStream(remoteStream);
        });
      });
    });
  }, [localStream]);

  const handleOpenVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setLocalStream(stream);
      localVideoRef.current.srcObject = stream;

      const peer = peerRef.current;
      if (oppPeerId && localStream) {
        const call = peer.call(oppPeerId, localStream);

        call.on("stream", (remoteStream) => {
          setRemoteStream(remoteStream);
        });
      } else {
        console.log("Please in  t opponent peer id and localstream");
      }
    } catch (error) {
      console.log("Error opening video", error);
    }
  };

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div
      className="container"
      style={{
        backgroundColor: "blue",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div className="input_field">
        <input
          type="text"
          placeholder="Search for video"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      <div className="lower_container">
        <YouTube
          videoId={mainVideoId || "NDjeeJwI08Q"}
          onPlay={onPlay}
          onPause={onPause}
          onStateChange={onStateChange}
          onReady={(event) => {
            player.current = event.target;
            // player.current.loadVideoById(mainVideoId);
          }}
          opts={opts}
        />

        <div className="videocalls">
          <div className="bar">
            <button onClick={handleOpenVideo}>Video Call</button>
          </div>
          <div className="videoCall">
            <div className="he">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                style={{
                  height: "100px",
                  width: " 100px",
                  border: "1px solid black",
                }}
              />
              <p>{namee}</p>
            </div>
            <div className="he">
              <video
                ref={remoteVideoRef}
                autoPlay
                muted
                style={{
                  height: "100px",
                  width: " 100px",
                  border: "1px solid black",
                }}
              />
              <p>{oppName}</p>
            </div>
          </div>
        </div>
      </div>

      <h2>Videoes</h2>
      <div className="hello">
        {videoes.map((video) => (
          <div
            key={video.id.videoId}
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              margin: "20px",
            }}
            // onClick={() => setMainVideoId(video.id.videoId)}
            onClick={() => handleVideoSwitch(video.id.videoId)}
          >
            <img
              src={video.snippet.thumbnails.default.url}
              alt={video.snippet.title}
              width="120"
              height="90"
              style={{ marginRight: "10px" }}
            />
            <div>
              <p style={{ fontWeight: "bold", margin: "0" }}>
                {video.snippet.title}
              </p>
              <p style={{ color: "#555", margin: "0" }}>
                {video.snippet.channelTitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Video;
