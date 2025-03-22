import React, { useState, useEffect, useRef, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { clearCachedContent, clearCache, saveToCache, getDeviceData } from "../custom-hooks/useCache";
import useFullScreen from "../custom-hooks/useFullScreen";
import login from "../api/login";
import { Summary, MultimediaContent } from "../interfaces/DeviceData";
import { BACKEND_ROOT, SOCKET_ROOT } from "../utils/config";
import events from "../utils/socketEvents";
import CarouselItem from "../components/CarouselItem";
import "../styles/Home.css";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showButton, setShowButton] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetDeviceModal, setShowResetDeviceModal] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [cachedContent, setCachedContent] = useState<MultimediaContent[]>([]);
  const [deviceSummary, setDeviceSummary] = useState<Summary | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [filteredContent, setFilteredContent] = useState<MultimediaContent[]>([]);
  const [videoDurations, setVideoDurations] = useState<{ [key: number]: number }>({});
  const inactivityTimer = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useFullScreen()

  const resetInactivityTimer = useCallback(() => {
    setShowButton(true);
    setShowTitle(true);
  
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  
    inactivityTimer.current = window.setTimeout(() => {
      setShowButton(false);
      setShowTitle(false);
    }, 3000);
  }, []);

  const filterAndSortContent = (content: MultimediaContent[]) => {
    const now = new Date();

    const filtered = content.filter((item) => {
      const startDate = item.play_beginning_date ? new Date(item.play_beginning_date) : null;
      const endDate = item.play_end_date ? new Date(item.play_end_date) : null;

      return (!startDate || now >= startDate) && (!endDate || now <= endDate);
    });

    filtered.sort((a, b) => {
      if (a.position_in_carousel != null && b.position_in_carousel != null) {
        return a.position_in_carousel - b.position_in_carousel;
      }
      return 0;
    });

    setFilteredContent(filtered);
  };

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

  const handleDeviceDeleted = async () => {
    console.log("Device deleted. Logging out...");
    await clearCache();
    navigate("/");
  };

  const handleContentUpdate = async () => {
    if (!deviceSummary) return;
    console.log("Content update detected, refreshing content...");

    setLoading(true);
    setProgress(0);

    try {
      const response = await login(deviceSummary.password);

      if(response && response.content) {
        const cacheCleared = await clearCachedContent();
        if(!cacheCleared) console.error('Error al limpiar la cache.')

        let completed = 0;
        let newContentArray = []

        for(const content of response.content) {
          const url = `${BACKEND_ROOT}${content.url_content}`;

          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const contentBlobed = { ...content, localUrl: blob ? URL.createObjectURL(blob) : null };
            
            const contentSaved = await saveToCache(contentBlobed.content, contentBlobed)
            if (!contentSaved) console.error('Error al guardar en cache: ', content.content);

            newContentArray.push(contentBlobed)
            completed++;
            const newProgress = Math.round((completed / response.content.length) * 100)
            setProgress(newProgress);
          } catch (error) {
            console.error('Error al procesar el contenido: ', content.url_content)
          }
        }

        setCachedContent(newContentArray)
        filterAndSortContent(newContentArray)
      }
    } catch (error) {
      console.error("Error updating content:", error);
      setShowResetDeviceModal(true);
    }
    setLoading(false);
  };

  const handleFinish = async () => {
    await clearCache();
    setShowResetDeviceModal(false);
    navigate("/");
  };

  const handleReload = useCallback(async () => {
    setShowResetDeviceModal(false);
    if (!deviceSummary) return;
    
    setLoading(true);
    setProgress(0);

    try {
      const response = await login(deviceSummary.password);

      if(response && response.content) {
        const cacheCleared = await clearCachedContent();
        if(!cacheCleared) console.error('Error al limpiar la cache.')

        let completed = 0;
        let newContentArray = []

        for(const content of response.content) {
          const url = `${BACKEND_ROOT}${content.url_content}`;

          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const contentBlobed = { ...content, localUrl: blob ? URL.createObjectURL(blob) : null };
            
            const contentSaved = await saveToCache(contentBlobed.content, contentBlobed)
            if (!contentSaved) console.error('Error al guardar en cache: ', content.content);

            newContentArray.push(contentBlobed)
            completed++;
            const newProgress = Math.round((completed / response.content.length) * 100)
            setProgress(newProgress);
          } catch (error) {
            console.error('Error al procesar el contenido: ', content.url_content)
          }
        }

        setCachedContent(newContentArray)
        filterAndSortContent(newContentArray)
      }
    } catch (error) {
      console.error("Error updating content:", error);
      setShowResetDeviceModal(true);
    }
    setLoading(false);
    
  }, [navigate]);

  useEffect(() => {
    let interval: number = 0;
  
    if (showResetDeviceModal) {
      interval = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleReload();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  
    return () => {
      if (interval) clearInterval(interval);
      setCountdown(10);
    };
  }, [showResetDeviceModal, handleReload]);

  useEffect(() => {
    window.addEventListener("mousemove", resetInactivityTimer);

    return () => {
      window.removeEventListener("mousemove", resetInactivityTimer);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivityTimer]);

  useEffect(() => {
    const loadCachedContent = async () => {
      const deviceData = await getDeviceData();
      
      if (deviceData) {
        if(deviceData.content.length === 0 && deviceData.summary) {
          try {
            await login(deviceData.summary.password);
          } catch (error) {
            console.error('Error al guardar en cache. ', error)
          }
        } else {
          setCachedContent(deviceData.content);
          filterAndSortContent(deviceData.content);
          setDeviceSummary(deviceData.summary);
        }
      } else {
        navigate("/");
      }
    };
  
    loadCachedContent();
  }, [navigate]);

  useEffect(() => {
    if (deviceSummary?.password && !socketRef.current) {
      socketRef.current = io(`${SOCKET_ROOT}?password=${deviceSummary.password}`);
      console.log(`Device ${deviceSummary.password} connected to SocketIO Server`);
  
      events.forEach((event) => socketRef.current!.on(event, handleContentUpdate));
      socketRef.current!.on("onDeviceDeleted", handleDeviceDeleted);
    }
  
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [deviceSummary?.password]);

  useEffect(() => {
    if (cachedContent.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % cachedContent.length);
      }, 5000); // Change every 5 seconds

      return () => clearInterval(interval);
    }
  }, [cachedContent]);

  useEffect(() => {
    if (videoRef) {
      captureThumbnail(videoRef);
    }
  }, [videoRef]);

  useEffect(() => {
    if (filteredContent.length > 0) {
      const currentItem = filteredContent[currentIndex];

      if (!currentItem) {
        setCurrentIndex(0); // Resetear índice si el item no existe
        return;
      }
      
      let duration = 3500; // Default for images

      if (currentItem?.url_content?.match(/\.(mp4|mov|gif)$/i)) {
        duration = videoDurations[currentItem.id_content] ?? 5000;
      } else if (
        [currentItem.hour, currentItem.minute, currentItem.seconds].some(
          (val) => val !== null && val !== undefined
        )
      ) {
        duration = ((currentItem.hour || 0) * 3600 + (currentItem.minute || 0) * 60 + (currentItem.seconds || 5)) * 1000;
      }

      const timeout = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredContent.length);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, filteredContent, videoDurations]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [filteredContent]);

  return (
    <div className="carousel-container"
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
            filteredContent[currentIndex]
              ? filteredContent[currentIndex].url_content?.endsWith(".mp4") ||
                filteredContent[currentIndex].url_content?.endsWith(".gif") ||
                filteredContent[currentIndex].url_content?.endsWith(".mov") ||
                filteredContent[currentIndex].url_content?.endsWith(".avi") ||
                filteredContent[currentIndex].url_content?.endsWith(".wmv") ||
                filteredContent[currentIndex].url_content?.endsWith(".mkv") ||
                filteredContent[currentIndex].url_content?.endsWith(".flv")
                ? videoThumbnail
                  ? `url(${videoThumbnail})`
                  : "none"
                : `url(${encodeURI(filteredContent[currentIndex].localUrl)})`
              : deviceSummary?.organization
                ? `url(${encodeURI(deviceSummary.organization)}${deviceSummary.type === 'TV' ? '-Horizontal' : '-Vertical'}.svg)`
                : "none",
          backgroundColor: videoThumbnail ? "transparent" : "#5a5a5a",
        }}
      ></div>;

      {/* Carousel */}
      <div className="carousel">
        {filteredContent.length > 0 ? (
          filteredContent.map((media, index) => (
            <CarouselItem
              key={media.id_content}
              media={media}
              isActive={index === currentIndex}
              setVideoRef={index === currentIndex ? setVideoRef : undefined}
              handleVideoMetadata={(video) => setVideoDurations((prev) => ({ ...prev, [media.id_content]: video.duration * 1000 }))}
            />
          ))
        ) : deviceSummary ? (
          <img
            key={deviceSummary.organization}
            src={
              deviceSummary.type === 'TV' ? 
              `${encodeURI(deviceSummary.organization)}-Horizontal.svg` : 
              `${encodeURI(deviceSummary.organization)}-Vertical.svg`
            }
            alt={`Media ${deviceSummary.organization}`}
            className={"active"}
          />
        ) : null}
      </div>

      {/* Loading Bar */}
      {loading && (
        <div className="progress-modal">
          <p>Actualizando contenido... {progress}%</p>
          <div className="progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Title and Subtitle */}
      <h1 className={`carousel-title ${showTitle ? "visible" : ""}`}>{deviceSummary?.business_unity}</h1>
      <h2 className={`carousel-subtitle ${showTitle ? "visible" : ""}`}>{deviceSummary?.description}</h2>


      {/* Finish Button */}
      <button
        className={`finish-button ${showButton ? "visible" : ""}`}
        onClick={handleFinish}
      >
        Finalizar
      </button>

      {/* Error Modal */}
      {showResetDeviceModal && (
        <div className="reset-device-modal-overlay">
          <div className="reset-device-modal">
            <h3><b>Error de actualización</b></h3>
            <p>
              Se detectó una actualización pero ocurrió un error. 
              Reintentando en <b>{countdown} segundos</b>.
            </p>
            <div className="countdown">
              <div style={{ width: `${(countdown / 10) * 100}%` }} />
            </div>
            <button className="reset-device-modal-button" onClick={handleReload}>Reintentar ahora</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;