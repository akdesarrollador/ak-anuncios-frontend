import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeProps from '../interfaces/HomeProps';
import { useAuthStore } from '../store/useAuthStore';
import { BACKEND_ROOT } from '../utils/config';
import '../styles/Home.css';

const Home: React.FC<HomeProps> = ({ content, deviceParams }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
  const { onLogout } = useAuthStore()

  const captureThumbnail = (video: HTMLVideoElement) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    if (!ctx) return;
  
    // Ensure video metadata is loaded before capturing the frame
    if (video.readyState >= 2) { // 'HAVE_CURRENT_DATA' or greater
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setVideoThumbnail(canvas.toDataURL("image/jpeg"));
    } else {
      // Retry when metadata is loaded
      video.addEventListener("loadeddata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setVideoThumbnail(canvas.toDataURL("image/jpeg"));
      }, { once: true });
    }
  };
  

  useEffect(() => {
    if (content.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % content.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [content]);

  return (
    <div
      className="carousel-container"
      onMouseEnter={() => setShowButton(true)}
      onMouseLeave={() => setShowButton(false)}
    >

    <div
      className="blurred-background"
      style={{
        backgroundImage:
          content.length > 0
            ? content[currentIndex].url_content.endsWith('.mp4') ||
              content[currentIndex].url_content.endsWith('.gif') ||
              content[currentIndex].url_content.endsWith('.mov')
              ? videoThumbnail
                ? `url(${videoThumbnail})` // Use captured frame if available
                : "none" // Avoid setting null, fallback to transparent
              : `url(${encodeURI(BACKEND_ROOT + content[currentIndex].url_content)})`
            : `url(${encodeURI(deviceParams.organization)}.svg)`,
        backgroundColor: videoThumbnail ? "transparent" : "#000", // Avoid white background issue
      }}
    ></div>

    {/* Carousel */} 
    <div className="carousel">
      {content.length > 0 ? (
        content.map((media, index) => {
          const isActive = index === currentIndex;
          const isVideo = media.url_content.endsWith('.mp4') || media.url_content.endsWith('.gif') || media.url_content.endsWith('.mov');

          if (isVideo) {
            return (
              <video
                key={media.content}
                src={encodeURI(BACKEND_ROOT + media.url_content)}
                autoPlay
                muted
                loop
                className={isActive ? 'active' : ''}
                onLoadedData={(e) => {
                  if (isActive) {
                    captureThumbnail(e.target as HTMLVideoElement);
                  }
                }}
              ></video>
            );
          } else {
            return (
              <img
                key={media.content}
                src={encodeURI(BACKEND_ROOT + media.url_content)}
                alt={`Media ${index}`}
                className={isActive ? 'active' : ''}
              />
            );
          }
        })
      ) : (
        <img
          key={deviceParams.organization}
          src={`${encodeURI(deviceParams.organization)}.svg`}
          alt={`Media ${deviceParams.organization}`}
          className={'active'}
        />
      )}
    </div>

    {/* Finish button */}
    <button
        className={`finish-button ${showButton ? 'visible' : ''}`}
        onClick={() => {
          onLogout()
          const navigate = useNavigate();
          navigate('/');
        }}
      >Finalizar
      </button>
    </div>
  );
};

export default Home;