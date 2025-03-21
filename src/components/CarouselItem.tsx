import React from "react";
import CarouselItemProps from "../interfaces/CarouselItemProps";

const CarouselItem: React.FC<CarouselItemProps> = React.memo(
  ({ media, isActive, setVideoRef, handleVideoMetadata }) => {
    const isVideo = /\.(mp4|mov|gif)$/i.test(media.url_content);
    const rotationStyle = { transform: `rotate(${media.rotation ?? 0}deg)` };

    if (isVideo && isActive) {
      return (
        <video
          ref={setVideoRef}
          src={media.localUrl}
          autoPlay
          loop
          onLoadedMetadata={(e) =>
            handleVideoMetadata?.(e.target as HTMLVideoElement, media.id_content)
          }
          className="active"
          style={rotationStyle}
        />
      );
    }

    return (
      <img
        src={media.localUrl}
        alt="Media"
        className={isActive ? "active" : ""}
        style={rotationStyle}
        loading="lazy"
      />
    );
  }
);

export default CarouselItem;
