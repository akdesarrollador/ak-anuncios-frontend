import React from 'react';
import Router from './routes/router';
import './styles/global.css';

const App: React.FC = () => {

  return (
    <div className="app">
      <Router></Router>
    </div>
  );
};

export default App;