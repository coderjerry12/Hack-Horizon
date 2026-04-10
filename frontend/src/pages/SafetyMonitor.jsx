import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Upload, WarningCircle as AlertTriangle, CheckCircle, SpinnerGap as Loader2, Eye, Lightning as Zap, Shield, House as Home, ClockCounterClockwise as History } from '@phosphor-icons/react';

const FLASK_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5003';

export default function SafetyMonitor() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [model, setModel] = useState('gemini');
  const [view, setView] = useState('home');
  const [stream, setStream] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportData, setReportData] = useState(null);

  const startCamera = async () => {
    setView('camera');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch { setView('home'); }
  };

  const stopStream = () => { if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); } };

  const captureFrame = video => new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(resolve, 'image/jpeg', 0.8);
  });

  const sendToFlask = async blobs => {
    const formData = new FormData();
    blobs.forEach((blob, idx) => formData.append(`image${idx}`, blob, `frame${idx}.jpg`));
    formData.append('model_provider', model === 'ollama' ? 'llava' : 'gemini');

    // Pass auth token for auto-SOS trigger
    const stored = localStorage.getItem('nearhelp-auth');
    const token = stored ? JSON.parse(stored)?.state?.user?.accessToken : null;
    if (token) formData.append('access_token', token);

    // Pass location if available
    if (navigator.geolocation) {
      await new Promise(resolve => navigator.geolocation.getCurrentPosition(
        pos => {
          formData.append('email_config', JSON.stringify({
            name: 'AI Monitor User',
            phone: 'N/A',
            emergency_phone: '112',
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            maps_link: `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
          }));
          resolve();
        },
        () => {
          formData.append('email_config', JSON.stringify({ name: 'AI Monitor User', phone: 'N/A', emergency_phone: '112' }));
          resolve();
        },
        { timeout: 3000 }
      ));
    } else {
      formData.append('email_config', JSON.stringify({ name: 'AI Monitor User', phone: 'N/A', emergency_phone: '112' }));
    }

    const res = await fetch(`${FLASK_URL}/api/analyze`, { method: 'POST', body: formData });
    return res.json();
  };

  const analyze = async blobs => {
    setIsAnalyzing(true);
    try {
      const data = await sendToFlask(blobs);
      
      // Check if it's a cooldown message
      if (data.message && data.message.includes('next analysis in')) {
        setReportData({ 
          modelUsed: model === 'gemini' ? 'Gemini 2.5 Flash' : 'LLaVA 7b (Ollama)', 
          diagnosis: 'System is in cooldown period to prevent API overuse.',
          emergency: false, 
          recommendation: data.message,
          isCooldown: true
        });
      }
      // Check if no person detected
      else if (data.message && data.message.includes('No person detected')) {
        setReportData({ 
          modelUsed: 'YOLO Detection', 
          diagnosis: 'No person was detected in the captured frames.',
          emergency: false, 
          recommendation: 'Ensure a person is visible in the camera frame and try again.',
          isNoPerson: true
        });
      }
      // Normal analysis result
      else {
        const diagnosis = data.crisis_type && data.intensity !== undefined && data.flag
          ? `Crisis Type: ${data.crisis_type}\nSeverity: ${data.intensity}/100\nStatus: ${data.flag}\n\n${data.message || 'Analysis complete.'}`
          : data.message || 'Unknown error.';
        
        setReportData({ 
          modelUsed: model === 'gemini' ? 'Gemini 2.5 Flash' : 'LLaVA 7b (Ollama)', 
          diagnosis: diagnosis,
          emergency: data.emergency || false, 
          recommendation: data.emergency 
            ? 'IMMEDIATE ATTENTION REQUIRED. Emergency contacts have been notified.' 
            : 'No critical danger detected. Continue monitoring.',
          crisisType: data.crisis_type,
          intensity: data.intensity,
          flag: data.flag
        });
      }
    } catch (err) {
      setReportData({ 
        modelUsed: model, 
        diagnosis: 'Analysis failed — ensure Python backend (port 5003) is running.',
        emergency: false, 
        recommendation: 'Check that the Flask server and Ollama are running.',
        isError: true
      });
    } finally { 
      setIsAnalyzing(false); 
      setView('report'); 
    }
  };

  const stopCameraAndCapture = async () => {
    if (!videoRef.current) return;
    setIsAnalyzing(true);
    const frames = [];
    for (let i = 0; i < 3; i++) { const b = await captureFrame(videoRef.current); if (b) frames.push(b); await new Promise(r => setTimeout(r, 200)); }
    stopStream();
    await analyze(frames);
  };

  const handleImageUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setView('analyzing');
    await analyze([file, file, file]);
    e.target.value = null;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-slate-100 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center"><Eye size={14} className="text-white" /></div>
              <h1 className="text-base font-bold text-slate-900">Safety Monitor</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setModel('gemini')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${model === 'gemini' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Gemini</button>
              <button onClick={() => setModel('ollama')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${model === 'ollama' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>Ollama</button>
            </div>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button onClick={() => { stopStream(); navigate('/dashboard'); }} className="nav-link" title="Dashboard"><Home size={20} /></button>
            <button onClick={() => { stopStream(); navigate('/monitor'); }} className="nav-link bg-orange-50 text-orange-600" title="Safety Monitor"><Camera size={20} /></button>
            <button onClick={() => { stopStream(); navigate('/history'); }} className="nav-link" title="History"><History size={20} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 border border-orange-200 mb-4">
                  <Zap size={13} className="text-orange-600" />
                  <span className="text-orange-700 text-xs font-semibold">YOLO + {model === 'gemini' ? 'Gemini 2.5 Flash' : 'LLaVA 7b'}</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">AI Safety Analysis</h2>
                <p className="text-slate-500 max-w-md mx-auto">Real-time accident and emergency detection using computer vision and large language models.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startCamera} className="card-elevated p-8 cursor-pointer flex flex-col items-center text-center gap-4 hover:border-slate-200 transition-all group">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"><Camera size={28} className="text-white" /></div>
                  <div><h3 className="text-lg font-bold text-slate-900">Live Camera</h3><p className="text-slate-500 text-sm mt-1">Capture 3 frames and analyze with AI in real-time</p></div>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Recommended</span>
                </motion.div>

                <div className="card-elevated p-8 cursor-pointer flex flex-col items-center text-center gap-4 hover:border-slate-200 transition-all group">
                  <label className="cursor-pointer flex flex-col items-center gap-4 w-full">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"><Upload size={28} className="text-white" /></div>
                    <div><h3 className="text-lg font-bold text-slate-900">Upload Image</h3><p className="text-slate-500 text-sm mt-1">Upload a photo for instant AI safety analysis</p></div>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Any format</span>
                  </label>
                </div>
              </div>

              <div className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center"><Shield size={16} className="text-blue-600" /></div>
                  <h3 className="font-bold text-slate-900">How it works</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { step: '1', title: 'Capture', desc: 'Camera captures 3 frames or you upload an image' },
                    { step: '2', title: 'YOLO Detection', desc: 'YOLOv11 detects if a person is present in the frame' },
                    { step: '3', title: 'AI Analysis', desc: `${model === 'gemini' ? 'Gemini 2.5 Flash' : 'LLaVA 7b'} analyzes safety and detects emergencies` },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{step}</div>
                      <div><p className="font-semibold text-slate-900 text-sm">{title}</p><p className="text-slate-500 text-xs mt-0.5">{desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'camera' && (
            <motion.div key="camera" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="rounded-3xl overflow-hidden bg-slate-950 mt-4 relative" style={{ height: '580px' }}>
              <video ref={node => { videoRef.current = node; if (node && stream) node.srcObject = stream; }} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className={`absolute inset-0 pointer-events-none ${isAnalyzing ? 'bg-slate-950/80 backdrop-blur-sm' : ''}`} />
              {isAnalyzing ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
                  <p className="font-semibold text-lg">Analyzing with YOLO + {model === 'gemini' ? 'Gemini' : 'LLaVA'}...</p>
                  <p className="text-slate-400 text-sm">Processing 3 frames</p>
                </div>
              ) : (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                  <button onClick={() => { setView('home'); stopStream(); }} className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur text-white font-semibold hover:bg-white/20 transition-all active:scale-95">Cancel</button>
                  <button onClick={stopCameraAndCapture} className="px-8 py-3 rounded-2xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all active:scale-95 shadow-xl">Capture & Analyze</button>
                </div>
              )}
              {/* Viewfinder overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/30 rounded-3xl" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)' }} />
              </div>
            </motion.div>
          )}

          {view === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl bg-slate-950 mt-4 flex flex-col items-center justify-center text-white gap-4" style={{ height: '400px' }}>
              <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
              <p className="font-semibold text-lg">Analyzing uploaded image...</p>
              <p className="text-slate-400 text-sm">YOLO + {model === 'gemini' ? 'Gemini 2.5 Flash' : 'LLaVA 7b'}</p>
            </motion.div>
          )}

          {view === 'report' && reportData && (
            <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-elevated mt-4 overflow-hidden">
              <div className={`p-6 ${reportData.emergency ? 'bg-gradient-to-r from-red-600 to-red-700' : reportData.isCooldown ? 'bg-gradient-to-r from-amber-600 to-amber-700' : reportData.isNoPerson ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-slate-800 to-slate-900'} text-white`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${reportData.emergency ? 'bg-red-800/50' : 'bg-white/10'} flex items-center justify-center`}>
                    {reportData.emergency ? <AlertTriangle size={28} /> : <CheckCircle size={28} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {reportData.emergency ? 'Emergency Detected' : reportData.isCooldown ? 'Cooldown Active' : reportData.isNoPerson ? 'No Person Detected' : 'No Emergency'}
                    </h2>
                    <p className="opacity-75 text-sm mt-0.5">Analyzed by {reportData.modelUsed}</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6">
                {reportData.crisisType && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Crisis Type</p>
                      <p className="text-lg font-bold text-slate-900 capitalize">{reportData.crisisType}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Severity Level</p>
                      <p className="text-lg font-bold text-slate-900">{reportData.intensity}/100</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Status</p>
                      <p className="text-lg font-bold text-slate-900 capitalize">{reportData.flag}</p>
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-3">AI Findings</h4>
                  <div className="text-slate-800 leading-relaxed text-sm p-5 bg-slate-50 rounded-2xl border border-slate-100 whitespace-pre-wrap">{reportData.diagnosis}</div>
                </div>
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-3">Recommendation</h4>
                  <div className={`${reportData.emergency ? 'bg-red-50 text-red-900 border border-red-200' : reportData.isCooldown ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'} p-5 rounded-2xl font-medium`}>{reportData.recommendation}</div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setView('home')} className="flex-1 btn-primary rounded-2xl py-3">Analyze Again</button>
                  {reportData.emergency && <button onClick={() => navigate('/dashboard')} className="flex-1 btn-emergency rounded-2xl py-3">Go to Dashboard</button>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
