import React, { useState } from 'react';
import Login from './components/Login';
import Login2 from './components/Login2';
import Home from './components/Home';
import './styles/global.css';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [deviceParams, setDeviceParams] = useState<Record<string, any>>({})

  const handleLoginSuccess = (urls: string[], devParams: Object) => {
    setMediaUrls(urls);
    setDeviceParams(devParams)
    setIsLoggedIn(true);
  };

  return (
    <div className="app">
      {isLoggedIn ? <Home urls={mediaUrls} paramsDevice={deviceParams} /> : <Login2 onLoginSuccess={handleLoginSuccess} />}
    </div>
  );
};

export default App;