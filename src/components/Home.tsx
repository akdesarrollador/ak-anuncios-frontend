import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import { debounce } from "lodash";
import HomeProps from "../interfaces/HomeProps";
import login from "../api/login";
import CarouselItem from "./CarouselItem";
import { clearCache, getFromCache, saveToCache } from "../custom-hooks/useCache";
import { useAuthStore } from "../store/useAuthStore";
import useFullScreen from "../custom-hooks/useFullScreen";
import { BACKEND_ROOT, SOCKET_ROOT } from "../utils/config";
import events from "../utils/socketEvents";
import "../styles/Home.css";

const Home: React.FC<HomeProps> = ({ content, deviceParams }) => {
  const navigate = useNavigate();
  const { password, onLogout } = useAuthStore();
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [videoDurations, setVideoDurations] = useState<{ [key: number]: number }>({});
  const inactivityTimer = useRef<number | null>(null);
  const [cachedContent, setCachedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  useFullScreen()
  
  const validContent = useMemo(() => {
    const now = new Date();
    return content.filter((item) => {
      const playBeginningDate = item.play_beginning_date ? new Date(item.play_beginning_date) : null;
      const playEndDate = item.play_end_date ? new Date(item.play_end_date) : null;
      return (!playBeginningDate || now >= playBeginningDate) && (!playEndDate || now <= playEndDate);
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
        const response = await login(password);
        if (response && response.content) {
          await fetchAndCacheContent(response.content);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error("Error updating content:", error);
      }
    }, 3000),
    [password]
  );

  const fetchAndCacheContent = async (content: any[]) => {
    await clearCache();
    setProgress(0);
    setLoading(true);
  
    let completed = 0;
    const totalItems = content.length;
  
    for (const item of content) {
      const url = `${BACKEND_ROOT}${item.url_content}`;
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        await saveToCache(item.id_content.toString(), blob);
      } catch (error) {
        console.error(`Failed to cache ${url}`, error);
      }
  
      completed++;
      setProgress(Math.round((completed / totalItems) * 100));
    }
  
    setLoading(false);
  };

  const resetInactivityTimer = useCallback(() => {
    setShowButton(true);
    setShowTitle(true);
  
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  
    inactivityTimer.current = window.setTimeout(() => {
      setShowButton(false);
      setShowTitle(false);
    }, 3000);
  }, []);

  const captureThumbnail = (video: HTMLVideoElement) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    if (!ctx) return;
  
    try {
      video.crossOrigin = "anonymous"; // Ensure cross-origin handling
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL("image/jpeg");
      setVideoThumbnail(thumbnail);
    } catch (error) {
      console.warn("Unable to generate video thumbnail due to security restrictions:", error);
      setVideoThumbnail(null); // Fallback in case of security error
    }
  };

  const handleVideoMetadata = (video: HTMLVideoElement, id: number) => {
    setVideoDurations((prev) =>
      prev[id] ? prev : { ...prev, [id]: video.duration * 1000 }
    );
  };

  useEffect(() => {
    const loadCachedContent = async () => {
      const loadedContent = await Promise.all(
        content.map(async (item) => {
          const blob = await getFromCache(item.id_content.toString());
          return { ...item, localUrl: blob ? URL.createObjectURL(blob) : item.url_content };
        })
      );
      setCachedContent(loadedContent);
    };
    loadCachedContent();
  }, [content]);

  useEffect(() => {
    if (cachedContent.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % cachedContent.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [cachedContent]);

  useEffect(() => {
    window.addEventListener("mousemove", resetInactivityTimer);

    return () => {
      window.removeEventListener("mousemove", resetInactivityTimer);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivityTimer]);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(`${SOCKET_ROOT}?password=${password}`);
      console.log("Connected to Socket.io Server");
  
      const handleDeviceDeletion = () => {
        console.log("Device deleted. Logging out...");
        onLogout();
        navigate("/");
      };
  
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
              : `url(${encodeURI(deviceParams.organization)}${deviceParams.type === 'TV' ? '-Horizontal' : '-Vertical'}.svg)`,
          backgroundColor: videoThumbnail ? "transparent" : "#5a5a5a",
        }}
      ></div>;

      {/* Carousel */}
      <div className="carousel">
        {cachedContent.length > 0 ? (
          cachedContent.map((media, index) => (
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
            src={
              deviceParams.type === 'TV' ? 
              `${encodeURI(deviceParams.organization)}-Horizontal.svg` : 
              `${encodeURI(deviceParams.organization)}-Vertical.svg`
            }
            alt={`Media ${deviceParams.organization}`}
            className={"active"}
          />
        )}
      </div>

      {/* Title and Subtitle */}
      <h1 className={`carousel-title ${showTitle ? "visible" : ""}`}>{deviceParams.business_unity}</h1>
      <h2 className={`carousel-subtitle ${showTitle ? "visible" : ""}`}>{deviceParams.description}</h2>

      {/* Finish Button */}
      <button
        className={`finish-button ${showButton ? "visible" : ""}`}
        onClick={async () => {
          onLogout();
          await clearCache()
          navigate("/");
        }}
      >
        Finalizar
      </button>

      {loading && (
        <div className="progress-modal">
          <p>Actualizando contenido... {progress}%</p>
          <div className="progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;