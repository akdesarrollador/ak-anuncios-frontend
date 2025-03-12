import React, { useState, useEffect } from 'react';

interface HomeProps {
  urls: string[];
  paramsDevice: Record<string, any>;
}

const Home: React.FC<HomeProps> = ({ urls, paramsDevice }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (urls.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % urls.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [urls]);

  const currentUrl = urls.length > 0 ? `${import.meta.env.VITE_BACKEND_ROOT}${urls[currentIndex]}` : `../../public/${paramsDevice.organization}.svg`;

  return (
    <div className="home-container">
      <img src={currentUrl} alt="media" />
    </div>
  );
};

export default Home;