import React from "react";
import CarouselItemProps from "../interfaces/CarouselItemProps";
import { BACKEND_ROOT } from "../utils/config";

const CarouselItem: React.FC<CarouselItemProps> = React.memo(
  ({ media, isActive, setVideoRef, handleVideoMetadata }) => {
    const isVideo =
      media.url_content.endsWith(".mp4") ||
      media.url_content.endsWith(".mov") ||
      media.url_content.endsWith(".gif");

    return isVideo && isActive ? (
      <video
        key={media.id_content}
        ref={isActive ? setVideoRef ?? null : null}
        src={encodeURI(BACKEND_ROOT + media.url_content)}
        autoPlay
        loop
        onLoadedMetadata={(e) =>
          handleVideoMetadata && handleVideoMetadata(e.target as HTMLVideoElement, media.id_content)
        }
        className={isActive ? "active" : ""}
        style={{ transform: `rotate(${media.rotation ?? 0}deg)` }}
      />
    ) : (
      <img
        key={media.id_content}
        src={encodeURI(BACKEND_ROOT + media.url_content)}
        alt="Media"
        className={isActive ? "active" : ""}
        style={{ transform: `rotate(${media.rotation ?? 0}deg)` }}
        loading="lazy"
      />
    );
  }
);

export default React.memo(CarouselItem);
