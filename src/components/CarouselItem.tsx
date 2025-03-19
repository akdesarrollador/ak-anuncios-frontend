// import React from "react";
// import CarouselItemProps from "../interfaces/CarouselItemProps";
// import { BACKEND_ROOT } from "../utils/config";
// import { getFromCache } from "../custom-hooks/useCache";

// const CarouselItem: React.FC<CarouselItemProps> = React.memo(
//   ({ media, isActive, setVideoRef, handleVideoMetadata }) => {
//     const isVideo =
//       media.url_content.endsWith(".mp4") ||
//       media.url_content.endsWith(".mov") ||
//       media.url_content.endsWith(".gif");

//     return isVideo && isActive ? (
//       <video
//         key={media.id_content}
//         ref={isActive ? setVideoRef ?? null : null}
//         src={encodeURI(BACKEND_ROOT + media.url_content)}
//         autoPlay
//         loop
//         onLoadedMetadata={(e) =>
//           handleVideoMetadata && handleVideoMetadata(e.target as HTMLVideoElement, media.id_content)
//         }
//         className={isActive ? "active" : ""}
//         style={{ transform: `rotate(${media.rotation ?? 0}deg)` }}
//       />
//     ) : (
//       <img
//         key={media.id_content}
//         src={encodeURI(BACKEND_ROOT + media.url_content)}
//         alt="Media"
//         className={isActive ? "active" : ""}
//         style={{ transform: `rotate(${media.rotation ?? 0}deg)` }}
//         loading="lazy"
//       />
//     );
//   }
// );

// export default React.memo(CarouselItem);

import React, { useEffect, useState } from "react";
import CarouselItemProps from "../interfaces/CarouselItemProps";
import { BACKEND_ROOT } from "../utils/config";
import { getFromCache } from "../custom-hooks/useCache";

const CarouselItem: React.FC<CarouselItemProps> = React.memo(
  ({ media, isActive, setVideoRef, handleVideoMetadata }) => {
    const [src, setSrc] = useState<string | null>(null);
    const isVideo =
      media.url_content.endsWith(".mp4") ||
      media.url_content.endsWith(".mov") ||
      media.url_content.endsWith(".gif");

    useEffect(() => {
      const fetchCachedMedia = async () => {
        const cachedMedia = await getFromCache(media.id_content.toString());
        if (cachedMedia) {
          setSrc(URL.createObjectURL(cachedMedia));
        } else {
          // Fallback to the original URL if not found in cache
          setSrc(encodeURI(BACKEND_ROOT + media.url_content));
        }
      };

      fetchCachedMedia();
    }, [media.id_content, media.url_content]);

    if (!src) {
      return null; // or a loading spinner
    }

    return isVideo && isActive ? (
      <video
        key={media.id_content}
        ref={isActive ? setVideoRef ?? null : null}
        src={src}
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
        src={src}
        alt="Media"
        className={isActive ? "active" : ""}
        style={{ transform: `rotate(${media.rotation ?? 0}deg)` }}
        loading="lazy"
      />
    );
  }
);

export default React.memo(CarouselItem);
