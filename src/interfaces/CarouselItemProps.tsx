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

export default CarouselItemProps