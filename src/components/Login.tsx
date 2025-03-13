import React, { useState } from 'react';
import Loader from './Loader';
import ErrorModal from './ErrorModal';
import { useAuthStore } from '../store/useAuthStore';
import '../styles/Login.css';
import { MdKey } from "react-icons/md";

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { onLogin } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onLogin(password);
    } catch (err) {
      setError('Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Title and Subtitle outside the form container */}
      <div className="login-header">
        <h1 className="login-title">Alkosto Anuncios</h1>
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
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? <Loader /> : 'Ingresar'}
          </button>
        </form>
        {error && <ErrorModal message={error} onClose={() => setError(null)} />}
      </div>
    </div>
  );
};

export default Login;