import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import login from '../api/login';
import { saveDeviceSummary } from '../custom-hooks/useCache';
import { saveToCache, clearCache } from '../custom-hooks/useCache';
// import { MultimediaContent } from '../interfaces/DeviceData';
import useFullScreen from '../custom-hooks/useFullScreen';
import { BACKEND_ROOT } from '../utils/config';
import { MdKey } from "react-icons/md";
import '../styles/Login.css';

const Login: React.FC = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useFullScreen()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const response = await login(password);

      if (response.summary && response.content) {

        const cacheCleared = await clearCache()
        if(!cacheCleared) console.error('Error al limpiar la cache.')

        let completed = 0;
        for (const content of response.content) {
          const url = `${BACKEND_ROOT}${content.url_content}`;

          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const contentBlobed = { ...content, localUrl: blob ? URL.createObjectURL(blob) : null };

            const contentSaved = await saveToCache(contentBlobed.content, contentBlobed)
            if (!contentSaved) console.error('Error al guardar en cache: ', content.content);

            completed++;
            const newProgress = Math.round((completed / response.content.length) * 100)
            setProgress(newProgress);
          } catch (error) {
            console.error('Error al procesar el contenido: ', content.url_content)
          }
        }

        const summarySaved = await saveDeviceSummary(response.summary);
        if(!summarySaved) console.error('Error al guardar el resumen del dispositivo en cache')

        navigate("/home");
      } else {
        setError("La contraseña no coincide con nuestros registros.");
      }
    } catch (err) {
      setError("Error al obtener y guardar los datos del dispositivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Title and Subtitle */}
      <div className="login-header">
        <h1 className="login-title">Reproductor de Anuncios</h1>
        <h2 className="login-subtitle">
          Ingresa la contraseña del dispositivo suministrada por el departamento de marketing.
        </h2>
      </div>

      {/* Login Form */}
      <div className="login-box">
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-container">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña del dispositivo"
              className="login-input"
              required
            />
            <MdKey className="input-icon" />
          </div>
          <button type="submit" className="login-button" disabled={!password}>
            {loading ? "Cargando..." : "Ingresar"}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Progress Bar */}
      {loading && (
        <div className="progress-modal">
          <p>Descargando contenido... {progress}%</p>
          <div className="progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
