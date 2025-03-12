import React, { useState } from 'react';
import Loader from './Loader';
import ErrorModal from './ErrorModal';
import '../styles/Login.css'; // Import the CSS file for styling

interface LoginProps {
  onLoginSuccess: (urls: string[], deviceParams: Object) => void;
}

const Login2: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
  
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_ROOT}${import.meta.env.VITE_ENDPOINT_LOGIN}${password}`, 
          { method: 'GET' }
        );
  
        if (response.status !== 200) setError('La contraseña no coincide con nuestros registros');
  
        const data = await response.json()
        const urls = data.content.map((item: { url_content: string }) => item.url_content);
        
        onLoginSuccess(urls, data.summary);
      } catch (err) {
        setError(`Error de conexión: ${err}`);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Alkosto Anuncios</h1>
        <h2 className="login-subtitle">
          Ingresa la contraseña de dispositivo suministrada por el departamento de marketing.
        </h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña de dispositivo"
            className="login-input"
            required
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? <Loader /> : 'Ingresar'}
          </button>
        </form>
        {error && <ErrorModal message={error} onClose={() => setError(null)} />}
      </div>
    </div>
  );
};

export default Login2;