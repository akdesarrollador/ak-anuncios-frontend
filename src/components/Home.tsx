import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import HomeProps from "../interfaces/HomeProps";
import { useAuthStore } from "../store/useAuthStore";
import { BACKEND_ROOT, SOCKET_ROOT } from "../utils/config";
import "../styles/Home.css";

const Home: React.FC<HomeProps> = ({ content, deviceParams }) => {
  const navigate = useNavigate();
  const { password, onLogin, onLogout } = useAuthStore();
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showTitle, setShowTitle] = useState(false);

  const sortedContent = [...content].sort((a, b) => 
    (a.position_in_carousel ?? 0) - (b.position_in_carousel ?? 0)
  );

  useEffect(() => {
    if (sortedContent.length > 0) {
      const duration =
        ((sortedContent[currentIndex].hour ?? 0) * 3600 +
          (sortedContent[currentIndex].minute ?? 0) * 60 +
          (sortedContent[currentIndex].seconds ?? 5)) * 1000; // Convert to ms (default 5s)

      const interval = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % sortedContent.length);
      }, duration);

      return () => clearTimeout(interval);
    }
  }, [currentIndex, sortedContent]);

  useEffect(() => {
    const socket = io(`${SOCKET_ROOT}?password=${password}`);
    console.log("Connected to Socket.io Server");

    const events = [
      "onNewGlobalContent",
      "onDeletedGlobalContent",
      "onDeviceDeleted",
      "onAllContentRemoved",
      "onNewContent",
      "onRemovedContent",
      "onUpdatedContent",
    ];

    const handleContentUpdate = () => {
      if (password) onLogin(password);
    };

    events.forEach((event) => socket.on(event, handleContentUpdate));

    return () => {
      events.forEach((event) => {
        socket.off(event, handleContentUpdate);
      });
      socket.disconnect();
    };
  }, [password, onLogin]);

  useEffect(() => {
    if (videoRef) {
      captureThumbnail(videoRef);
    }
  }, [videoRef]);

  const captureThumbnail = (video: HTMLVideoElement) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    if (!ctx) return;
  
    if (video.readyState >= 2) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL("image/jpeg");
      setVideoThumbnail(thumbnail);
    } else {
      video.addEventListener(
        "loadeddata",
        () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL("image/jpeg");
          setVideoThumbnail(thumbnail);
        },
        { once: true }
      );
    }
  };

  return (
    <div
      className="carousel-container"
      onMouseEnter={() => {
        setShowButton(true);
        setShowTitle(true);
      }}
      onMouseLeave={() => {
        setShowButton(false);
        setShowTitle(false);
      }}
    >
      {/* Background Image or Video Thumbnail */}
      <div
        className="blurred-background"
        style={{
          backgroundImage:
            sortedContent.length > 0
              ? sortedContent[currentIndex].url_content.endsWith(".mp4") ||
                sortedContent[currentIndex].url_content.endsWith(".gif") ||
                sortedContent[currentIndex].url_content.endsWith(".mov")
                ? videoThumbnail
                  ? `url(${videoThumbnail})`
                  : "none"
                : `url(${encodeURI(BACKEND_ROOT + sortedContent[currentIndex].url_content)})`
              : `url(${encodeURI(deviceParams.organization)}.svg)`,
          backgroundColor: videoThumbnail ? "transparent" : "#5a5a5a",
        }}
      ></div>

      {/* Carousel */}
      <div className="carousel">
        {sortedContent.length > 0 ? (
          sortedContent.map((media, index) => {
            const isActive = index === currentIndex;
            const isVideo =
              media.url_content.endsWith(".mp4") ||
              media.url_content.endsWith(".gif") ||
              media.url_content.endsWith(".mov");

            return isVideo ? (
              <video
                key={media.content}
                ref={isActive ? setVideoRef : null}
                src={encodeURI(BACKEND_ROOT + media.url_content)}
                autoPlay
                muted
                loop
                style={{ transform: `rotate(${media.rotation ?? 0}deg)` }} // **Apply rotation**
                crossOrigin='anonymous'
                className={isActive ? "active" : ""}
              />
            ) : (
              <img
                key={media.id_content}
                src={encodeURI(BACKEND_ROOT + media.url_content)}
                alt={`Media ${index}`}
                className={isActive ? "active" : ""}
                style={{ transform: `rotate(${media.rotation ?? 0}deg)` }} // **Apply rotation**
              />
            );
          })
        ) : (
          <img
            key={deviceParams.organization}
            src={`${encodeURI(deviceParams.organization)}.svg`}
            alt={`Media ${deviceParams.organization}`}
            className={"active"}
          />
        )}
      </div>

      {/* Title and Subtitle */}
      <h1 className={`carousel-title ${showTitle ? "visible" : ""}`}>
        {deviceParams.business_unity}
      </h1>
      <h2 className={`carousel-subtitle ${showTitle ? "visible" : ""}`}>Descripción del dispositivo</h2>

      {/* Finish Button */}
      <button
        className={`finish-button ${showButton ? "visible" : ""}`}
        onClick={() => {
          onLogout();
          navigate("/");
        }}
      >
        Finalizar
      </button>
    </div>
  );
};

export default Home;
