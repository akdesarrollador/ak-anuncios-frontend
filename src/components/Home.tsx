import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import { debounce } from "lodash";
import HomeProps from "../interfaces/HomeProps";
import CarouselItem from "./CarouselItem";
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
  const [videoDurations, setVideoDurations] = useState<{ [key: number]: number }>({});
  const socketRef = useRef<Socket | null>(null);
  
  const validContent = useMemo(() => {
    const now = new Date();
    return content.filter((item) => {
      const playBeginningDate = item.play_beginning_date ? new Date(item.play_beginning_date) : null;
      const playEndDate = item.play_end_date ? new Date(item.play_end_date) : null;
      return (!playBeginningDate || now >= playBeginningDate) &&
             (!playEndDate || now <= playEndDate);
    });
  }, [content]);

  const sortedContent = useMemo(() => {
    return [...validContent].sort(
      (a, b) => (a.position_in_carousel ?? Number.MAX_SAFE_INTEGER) - (b.position_in_carousel ?? Number.MAX_SAFE_INTEGER)
    );
  }, [validContent]);

  const currentItem = sortedContent[currentIndex] ?? null;

  const handleContentUpdate = useCallback(
    debounce(async () => {
      if (!password) return;
      console.log(`Updating content for device ${password}...`);
      try {
        await onLogin(password);
        setCurrentIndex(0);
      } catch (error) {
        console.error("Error updating content:", error);
      }
    }, 3000),
    [password]
  );

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

  const handleVideoMetadata = (video: HTMLVideoElement, id: number) => {
    setVideoDurations((prev) =>
      prev[id] ? prev : { ...prev, [id]: video.duration * 1000 }
    );
  };

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(`${SOCKET_ROOT}?password=${password}`);
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
  
      events.forEach((event) => socketRef.current!.on(event, handleContentUpdate));
      socketRef.current!.on("onDeviceDeleted", handleDeviceDeletion);
    }
  
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (sortedContent.length > 0 && currentIndex < sortedContent.length) {
      const currentItem = sortedContent[currentIndex];
  
      let duration = 3500
  
      if (currentItem?.url_content?.endsWith(".mp4") || 
          currentItem?.url_content?.endsWith(".mov") || 
          currentItem?.url_content?.endsWith(".gif")) {
        duration = videoDurations[currentItem.id_content] ?? 5000;
      } else if (currentItem.hour !== null || currentItem.minute !== null || currentItem.seconds !== null) {
        duration = ((currentItem?.hour ?? 0) * 3600 + (currentItem?.minute ?? 0) * 60 + (currentItem?.seconds ?? 5)) * 1000;
      }
  
      const interval = setTimeout(() => {
        setCurrentIndex((prevIndex) => sortedContent.length > 0 ? (prevIndex + 1) % sortedContent.length : 0);
      }, duration);
  
      return () => clearTimeout(interval);
    }
  }, [currentIndex, sortedContent, videoDurations]);

  useEffect(() => {
    if (videoRef) {
      captureThumbnail(videoRef);
    }
  }, [videoRef]);

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
          sortedContent.map((media, index) => (
            <CarouselItem
              key={media.id_content}
              media={media}
              isActive={index === currentIndex}
              setVideoRef={index === currentIndex ? setVideoRef : undefined}
              handleVideoMetadata={handleVideoMetadata}
            />
          ))
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