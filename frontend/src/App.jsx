import { useState } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import Config from './pages/Config';
import Results from './pages/Results';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [config, setConfig] = useState({
    name: '',
    phone: '',
    emergency_phone: '',
    address: '',
    latitude: '',
    longitude: '',
    emergencyResponseEmail: '',
    modelProvider: 'gemini'
  });

  const handleAnalysis = (result) => {
    setAnalysisResult(result);
    setCurrentPage('results');
  };

  const handleConfigSave = (updatedConfig) => {
    setConfig(updatedConfig);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-title">🚨 Critical Care AI Safety Monitor</h1>
          <div className="nav-buttons">
            <button
              className={currentPage === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setCurrentPage('dashboard')}
            >
              📷 Monitor
            </button>
            <button
              className={currentPage === 'config' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setCurrentPage('config')}
            >
              ⚙️ Settings
            </button>
            <button
              className={currentPage === 'results' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setCurrentPage('results')}
              disabled={!analysisResult}
            >
              📊 Results
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard config={config} onAnalysis={handleAnalysis} />
        )}
        {currentPage === 'config' && (
          <Config initialConfig={config} onSave={handleConfigSave} />
        )}
        {currentPage === 'results' && analysisResult && (
          <Results result={analysisResult} />
        )}
      </main>

      <footer className="footer">
        <p>Emergency Response System v1.0 | YOLO + Gemini/Ollama Integration</p>
      </footer>
    </div>
  );
}
