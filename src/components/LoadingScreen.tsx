import "../styles/LoadingScreen.css"; // Import styles

const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Cargando...</p>
    </div>
  );
};

export default LoadingScreen;
