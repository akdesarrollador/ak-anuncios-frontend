import { useEffect } from "react";

const useFullScreen = () => {
  useEffect(() => {
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error("Error attempting to enable full-screen mode:", err);
        });
      }
    };

    window.addEventListener("dblclick", toggleFullscreen);
    
    return () => {
      window.removeEventListener("dblclick", toggleFullscreen);
    };
  }, []);
};

export default useFullScreen;
