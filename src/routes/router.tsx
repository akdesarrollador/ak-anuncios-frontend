import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getDeviceData } from "../custom-hooks/useCache";
import { DeviceData } from "../interfaces/DeviceData";
import Login from '../pages/Login';
import Home from "../pages/Home";
import LoadingScreen from "../components/LoadingScreen";

const Router = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);

  useEffect(() => {
    const loadDeviceData = async () => {
      setIsLoading(true);
      try {
        const cachedData = await getDeviceData();
        setDeviceData(cachedData);
      } catch (error) {
        setDeviceData(null)
      } finally {
        setIsLoading(false);
      }
    }

    loadDeviceData();
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/" element={(deviceData?.summary === undefined || deviceData?.content === undefined) ? <Login /> : <Home />} />
        <Route path="/login" element={<Login />}></Route>
        <Route path="/home" element={<Home />}></Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
