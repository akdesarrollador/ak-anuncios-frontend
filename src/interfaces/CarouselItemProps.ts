import { MultimediaContent } from "./DeviceData";

interface CarouselItemProps {
    media: MultimediaContent;
    isActive: boolean;
    setVideoRef?: (video: HTMLVideoElement | null) => void;
    handleVideoMetadata?: (video: HTMLVideoElement, id: number) => void;
  }
  
  export default CarouselItemProps