import React, { useState } from 'react';
import Loader from './Loader';
import ErrorModal from './ErrorModal';

interface LoginProps {
  onLoginSuccess: (urls: string[], deviceParams: Object) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
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
      <h1>Alkosto Anuncios</h1>
      <h2>Comunicate con el departamento de marketing para obtener una contraseña de dispositivo.</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? <Loader /> : 'Ingresar'}
        </button>
      </form>
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}
    </div>
  );
};

export default Login;