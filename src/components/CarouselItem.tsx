import React from "react";
import { BACKEND_ROOT } from "../utils/config";

interface CarouselItemProps {
  media: {
    id_content: number;
    url_content: string;
    rotation?: number | null;
  };
  isActive: boolean;
  setVideoRef?: (video: HTMLVideoElement | null) => void;
  handleVideoMetadata?: (video: HTMLVideoElement, id: number) => void;
}

const CarouselItem: React.FC<CarouselItemProps> = React.memo(
  ({ media, isActive, setVideoRef, handleVideoMetadata }) => {
    const isVideo =
      media.url_content.endsWith(".mp4") ||
      media.url_content.endsWith(".mov") ||
      media.url_content.endsWith(".gif");

    return isVideo && isActive ? ( //can fail here
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

// Memoize the component to prevent unnecessary re-renders
export default React.memo(CarouselItem);
