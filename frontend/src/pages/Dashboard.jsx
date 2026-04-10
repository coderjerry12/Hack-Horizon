import { useEffect, useRef, useState } from 'react';
import '../styles/Dashboard.css';

const API_URL = '';

export default function Dashboard({ config, onAnalysis }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [status, setStatus] = useState('Ready');
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const frameBufferRef = useRef([]);
  const intervalRef = useRef(null);

  // Check backend health
  useEffect(() => {
    const checkBackend = async () => {
      try {
        console.log(`[Dashboard] Attempting to connect to ${API_URL}/health`);
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Dashboard] Backend health check successful:', data);
          setBackendConnected(true);
          setStatus('✅ Backend connected');
        } else {
          console.error(`[Dashboard] Backend returned status ${response.status}`);
          setBackendConnected(false);
          setStatus(`⚠️ Backend error: ${response.status}`);
        }
      } catch (err) {
        console.error('[Dashboard] Backend connection failed:', err.message);
        setBackendConnected(false);
        setStatus('⚠️ Backend not connected - ensure Flask server is running on port 5003');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [isMonitoring]);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('Camera started');

      // Capture 1 frame every 500ms
      intervalRef.current = setInterval(captureFrame, 500);
    } catch (err) {
      console.error('Camera error:', err);
      setStatus('❌ Camera access denied');
      setIsMonitoring(false);
    }
  };

  const stopMonitoring = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setStatus('Monitoring stopped');
    frameBufferRef.current = [];
    setFrameCount(0);
  };

  const captureFrame = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        frameBufferRef.current.push(blob);
        setFrameCount(frameBufferRef.current.length);

        // Once we have 3 frames, send to analysis
        if (frameBufferRef.current.length === 3) {
          sendFramesForAnalysis();
        }
      }
    }, 'image/jpeg');
  };

  const sendFramesForAnalysis = async () => {
    if (loading) return;

    setLoading(true);
    setStatus('Analyzing frames...');

    const formData = new FormData();
    frameBufferRef.current.forEach((blob, idx) => {
      formData.append(`image${idx}`, blob, `frame${idx}.jpg`);
    });

    formData.append('email_config', JSON.stringify(config));
    formData.append('model_provider', config.modelProvider || 'gemini');

    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setStatus(result.emergency ? '🚨 EMERGENCY DETECTED' : '✅ Monitoring');
      frameBufferRef.current = [];
      setFrameCount(0);
      onAnalysis(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setStatus('❌ API Error: ' + err.message);
      frameBufferRef.current = [];
      setFrameCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <div className="video-section">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="video-feed"
            style={{ display: 'none' }}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="canvas-display"
          />
          <div className="status-overlay">
            <div className="status-text">{status}</div>
            <div className="frame-counter">Frames: {frameCount}/3</div>
          </div>
        </div>

        <div className="controls-section">
          <h2>📷 Real-Time Monitoring</h2>
          
          <div className="info-box">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Model:</strong> {config.modelProvider === 'gemini' ? 'Gemini 2.5-Flash' : 'Ollama LLaVA'}</p>
            <p><strong>User:</strong> {config.name || 'Not configured'}</p>
          </div>

          <button
            className={`start-btn ${isMonitoring ? 'monitoring' : ''}`}
            onClick={() => setIsMonitoring(!isMonitoring)}
            disabled={loading || !backendConnected}
            title={
              !backendConnected 
                ? '❌ Flask backend not connected - Start the Flask server first' 
                : loading 
                ? 'Processing...' 
                : isMonitoring 
                ? 'Stop camera monitoring' 
                : 'Start camera monitoring'
            }
          >
            {isMonitoring ? '⏹️ Stop Monitoring' : '▶️ Start Monitoring'}
          </button>

          <div className="quick-actions">
            <button 
              className="manual-btn"
              onClick={sendFramesForAnalysis}
              disabled={frameCount === 0 || loading}
            >
              🔄 Analyze Now ({frameCount}/3)
            </button>
          </div>

          <div className="info-panel">
            <h3>How it works:</h3>
            <ol>
              <li>Click "Start Monitoring" to enable camera</li>
              <li>System automatically captures 3 frames</li>
              <li>YOLO detects if person is present</li>
              <li>Gemini/Ollama analyzes safety status</li>
              <li>Emergency alerts sent if needed</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
