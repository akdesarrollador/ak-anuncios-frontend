import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import HomeProps from "../interfaces/HomeProps";
import { useAuthStore } from "../store/useAuthStore";
import { BACKEND_ROOT, SOCKET_ROOT } from "../utils/config";
import axios from "axios";
import "../styles/Home.css";

const Home: React.FC<HomeProps> = ({ content, deviceParams }) => {
  const navigate = useNavigate();
  const { password, onLogin, onLogout } = useAuthStore();
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [videoDurations, setVideoDurations] = useState<{ [key: number]: number }>({});
  
  const sortedContent = [...content].sort(
    (a, b) => (a.position_in_carousel ?? 0) - (b.position_in_carousel ?? 0)
  );

  const currentItem = sortedContent[currentIndex] ?? null;
  
  const handleContentUpdate = async (retries = 3) => {
    if (!password) return;

    console.log(`Update detected. Refreshing content for device ${password}...`);

    try {
      await onLogin(password); 
      setCurrentIndex(0);
    } catch (error) {
      console.error("Error updating content:", error);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK' && retries > 0) {
          console.log(`Retrying... Attempts left: ${retries}`);
          setTimeout(() => handleContentUpdate(retries - 1), 2000);
        } else {
          alert("Network error. Please check your connection.");
        }
      } else {
        alert("An unexpected error occurred.");
      }
    }
  };

  useEffect(() => {
    const socket = io(`${SOCKET_ROOT}?password=${password}`);
    console.log("Connected to Socket.io Server");

    const handleDeviceDeletion = () => {
      console.log("Device deleted. Logging out...");
      onLogout();
      navigate("/");
    };
  
    const events = [
      "onNewGlobalContent",
      "onDeletedGlobalContent",
      "onNewContent",
      "onRemovedContent",
      "onUpdatedContent",
      "onAllContentRemoved"
    ];
  
    events.forEach((event) => socket.on(event, handleContentUpdate));

    socket.on("onDeviceDeleted", handleDeviceDeletion);
  
    return () => {
      events.forEach((event) => {
        socket.off(event, handleContentUpdate);
      });
      socket.off("onDeviceDeleted", handleDeviceDeletion);
      socket.disconnect();
    };
  }, [password, onLogin, onLogout, navigate]);

  useEffect(() => {
    if (sortedContent.length > 0 && currentIndex < sortedContent.length) {
      const currentItem = sortedContent[currentIndex];
  
      let duration = 5000; // Default 5s
  
      if (currentItem?.url_content?.endsWith(".mp4") || 
          currentItem?.url_content?.endsWith(".mov") || 
          currentItem?.url_content?.endsWith(".gif")) {
        duration = videoDurations[currentItem.id_content] ?? 5000;
      } else {
        duration =
          ((currentItem?.hour ?? 0) * 3600 +
            (currentItem?.minute ?? 0) * 60 +
            (currentItem?.seconds ?? 5)) * 1000;
      }
  
      const interval = setTimeout(() => {
        setCurrentIndex((prevIndex) => 
          sortedContent.length > 0 ? (prevIndex + 1) % sortedContent.length : 0
        );
      }, duration);
  
      return () => clearTimeout(interval);
    }
  }, [currentIndex, sortedContent, videoDurations]);
  

  const handleVideoMetadata = (video: HTMLVideoElement, id: number) => {
    if (video.duration && !videoDurations[id]) {
      setVideoDurations((prev) => ({ ...prev, [id]: video.duration * 1000 }));
    }
  };

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
          currentItem
            ? currentItem.url_content?.endsWith(".mp4") ||
              currentItem.url_content?.endsWith(".gif") ||
              currentItem.url_content?.endsWith(".mov")
              ? videoThumbnail
                ? `url(${videoThumbnail})`
                : "none"
              : `url(${encodeURI(BACKEND_ROOT + currentItem.url_content)})`
            : `url(${encodeURI(deviceParams.organization)}.svg)`,
        backgroundColor: videoThumbnail ? "transparent" : "#5a5a5a",
      }}
    ></div>;

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
                key={media.id_content}
                ref={isActive ? setVideoRef : null}
                src={encodeURI(BACKEND_ROOT + media.url_content)}
                autoPlay
                muted
                loop
                onLoadedMetadata={(e) => handleVideoMetadata(e.target as HTMLVideoElement, media.id_content)}
                crossOrigin="anonymous"
                className={isActive ? "active" : ""}
                style={{ transform: `rotate(${media.rotation ?? 0}deg)` }}
              />
            ) : (
              <img
                key={media.id_content}
                src={encodeURI(BACKEND_ROOT + media.url_content)}
                alt={`Media ${index}`}
                className={isActive ? "active" : ""}
                style={{ transform: `rotate(${media.rotation ?? 0}deg)` }}
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
      <h2 className={`carousel-subtitle ${showTitle ? "visible" : ""}`}>{deviceParams.description}</h2>

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

