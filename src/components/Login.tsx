import React, { useState } from 'react';
import Loader from './Loader';
import ErrorModal from './ErrorModal';
import login from '../api/login';
import { useAuthStore } from '../store/useAuthStore';
import { saveToCache, clearCache } from '../custom-hooks/useCache';
import useFullScreen from '../custom-hooks/useFullScreen';
import { BACKEND_ROOT } from '../utils/config';
import { MdKey } from "react-icons/md";
import '../styles/Login.css';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { onLogin } = useAuthStore();

  useFullScreen()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login(password);

      if (response && response.content) {
        await clearCache()
        let completed = 0

        for (const item of response.content) {
          const url = `${BACKEND_ROOT}${item.url_content}`;

          try {
            const response = await fetch(url);
            const blob = await response.blob();
            await saveToCache(item.id_content.toString(), blob);
            completed++;
          } catch (error) {
            console.error(`Failed to cache ${url}`, error);
          }
          
          setProgress(Math.round((completed / response.content.length) * 100));
        }

        onLogin(password, response.content, response.summary)
      }
    } catch (err) {
      setError("La contraseña no se encuentra en nuestros registros.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Title and Subtitle outside the form container */}
      <div className="login-header">
        <h1 className="login-title">Reproductor de Anuncios</h1>
        <h2 className="login-subtitle">
          Ingresa la contraseña de dispositivo suministrada por el departamento de marketing.
        </h2>
      </div>

      {/* Form container */}
      <div className="login-box">
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-container">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña de dispositivo"
              className="login-input"
              required
            />
            <MdKey className="input-icon" />
          </div>
          <button 
            type="submit" 
            className="login-button" 
            disabled={password.length > 0 ? false : true}
          >
            {loading ? <Loader /> : 'Ingresar'}
          </button>
        </form>
        {error && <ErrorModal message={error} onClose={() => setError(null)} />}
      </div>

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