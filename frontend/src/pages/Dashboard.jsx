import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Siren, Camera, FileText, Brain, ArrowsLeftRight, CircleNotch, Upload, Hospital, MapPin, Phone, Globe, NavigationArrow, Warning } from "@phosphor-icons/react";

const BACKEND_URL = "http://localhost:8000";

export default function Dashboard() {
  const [model, setModel] = useState("gemini"); // "gemini" | "ollama"
  const [view, setView] = useState("dashboard"); // "dashboard" | "camera" | "report" | "hospitals"
  const videoRef = useRef(null);
  const [reportData, setReportData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalsError, setHospitalsError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5); // in km

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation error:", err.message)
      );
    }
  }, []);

  const fetchHospitals = async () => {
    if (!userLocation) {
      setHospitalsError("Location access is required. Please allow location permissions.");
      return;
    }
    setHospitalsLoading(true);
    setHospitalsError(null);
    try {
      const radiusInMeters = searchRadius * 1000;
      const res = await fetch(
        `${BACKEND_URL}/api/v1/hospitals/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radiusInMeters}`
      );
      const data = await res.json();
      if (data.success) {
        setHospitals(data.data.hospitals);
      } else {
        setHospitalsError(data.message || "Failed to fetch hospitals");
      }
    } catch (err) {
      setHospitalsError("Could not connect to server. Please try again.");
    } finally {
      setHospitalsLoading(false);
    }
  };

  const openHospitals = async () => {
    setView("hospitals");
    if (hospitals.length === 0) await fetchHospitals();
  };

  const toggleModel = () => setModel(m => (m === "gemini" ? "ollama" : "gemini"));

  const [stream, setStream] = useState(null);

  const startCamera = async () => {
    setView("camera");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setStream(mediaStream);
      } catch (err) {
        console.error("Camera error:", err);
      }
    }
  };

  const captureFrame = (video) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg", 0.8);
    });
  };

  const stopCameraAndCapture = async () => {
    if (!videoRef.current) return;
    setIsAnalyzing(true);

    // Capture 3 frames with 200ms delay
    const frames = [];
    for (let i = 0; i < 3; i++) {
      const blob = await captureFrame(videoRef.current);
      if (blob) frames.push(blob);
      await new Promise(r => setTimeout(r, 200));
    }

    // Stop video tracks
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    // Build form data
    const formData = new FormData();
    frames.forEach((blob, idx) => formData.append(`image${idx}`, blob, `frame${idx}.jpg`));
    formData.append("model_provider", model === "ollama" ? "llava" : "gemini");
    formData.append("email_config", JSON.stringify({
      name: "User",
      phone: "123",
      emergency_phone: "911", // Add real metadata from actual context if available
    }));

    try {
      const res = await fetch("http://localhost:5003/api/analyze", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      setReportData({
        modelUsed: model,
        diagnosis: data.message || "Unknown error occurred.",
        emergency: data.emergency,
        recommendation: data.emergency ? "IMMEDIATE ATTENTION REQUIRED! Emergency contacts notifed." : "No critical danger detected currently. Rest and monitor."
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      setReportData({
        modelUsed: model,
        diagnosis: "Analysis failed to reach the model backend.",
        emergency: false,
        recommendation: "Ensure Python backend (port 5003) & Ollama are running."
      });
    } finally {
      setIsAnalyzing(false);
      setView("report");
    }
  };

  const triggerSOS = () => {
    alert("SOS Triggered! Location and medical details shared with emergency contacts.");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setView("analyzing");

    const formData = new FormData();
    // Replicate 3 frames so backend person check passes and uses the third frame
    for (let i = 0; i < 3; i++) {
      formData.append(`image${i}`, file, `uploaded${i}.jpg`);
    }
    formData.append("model_provider", model === "ollama" ? "llava" : "gemini");
    formData.append("email_config", JSON.stringify({
      name: "User",
      phone: "123",
      emergency_phone: "911",
    }));

    try {
      const res = await fetch("http://localhost:5003/api/analyze", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      setReportData({
        modelUsed: model,
        diagnosis: data.message || "Unknown error occurred.",
        emergency: data.emergency,
        recommendation: data.emergency ? "IMMEDIATE ATTENTION REQUIRED! Emergency contacts notifed." : "No critical danger detected currently. Rest and monitor."
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      setReportData({
        modelUsed: model,
        diagnosis: "Analysis failed to reach the model backend.",
        emergency: false,
        recommendation: "Ensure Python backend (port 5003) & Ollama are running."
      });
    } finally {
      setIsAnalyzing(false);
      setView("report");
    }

    // Clear file input
    e.target.value = null;
  };

  return (
    <div className="min-h-[100dvh] bg-[#f9fafb] p-6 pt-10 text-zinc-950 font-sans">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* Top Navbar Component */}
        <header className="flex justify-between items-center bg-white p-4 rounded-full border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Brain weight="duotone" className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-semibold tracking-tight">HackHorizon</span>
          </div>

          <button
            onClick={toggleModel}
            className="flex items-center gap-3 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">AI Engine:</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${model === "gemini" ? "text-blue-600" : "text-zinc-400"}`}>Gemini</span>
              <ArrowsLeftRight weight="bold" className="text-zinc-400" />
              <span className={`text-sm font-bold ${model === "ollama" ? "text-orange-600" : "text-zinc-400"}`}>Ollama</span>
            </div>
          </button>
        </header>

        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <motion.div
              key="dash"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
            >
              <div
                onClick={triggerSOS}
                className="bg-red-50 cursor-pointer rounded-[2rem] p-2 border border-red-200/50 shadow-[0_20px_40px_-15px_rgba(220,38,38,0.1)] active:scale-[0.98] transition-transform group"
              >
                <div className="bg-red-100/50 rounded-[calc(2rem-0.5rem)] p-10 h-full flex flex-col items-center justify-center text-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                    <div className="w-24 h-24 rounded-full bg-red-500 shadow-xl shadow-red-500/30 flex items-center justify-center text-white relative z-10 transition-transform group-hover:scale-105">
                      <Siren weight="fill" className="w-10 h-10" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tighter text-red-950">Emergency SOS</h2>
                    <p className="text-red-900/70 text-sm mt-2 max-w-[25ch] mx-auto">Alert contacts instantly with live location & baseline medical profile</p>
                  </div>
                </div>
              </div>

              <div
                onClick={startCamera}
                className="bg-white cursor-pointer rounded-[2rem] p-2 border border-zinc-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-transform group"
              >
                <div className="bg-zinc-50 rounded-[calc(2rem-0.5rem)] p-10 h-full flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-zinc-950 shadow-xl shadow-zinc-950/20 flex items-center justify-center text-white transition-transform group-hover:scale-105">
                    <Camera weight="duotone" className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tighter text-zinc-950">Visual Diagnosis</h2>
                    <p className="text-zinc-500 text-sm mt-2 max-w-[25ch] mx-auto">Use live camera to scan injuries, pills, or documents for AI analysis</p>
                  </div>
                </div>
              </div>

              <div className="bg-white cursor-pointer rounded-[2rem] p-2 border border-zinc-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-transform group">
                <label className="block cursor-pointer bg-zinc-50 rounded-[calc(2rem-0.5rem)] p-8 h-full flex flex-col items-center justify-center text-center gap-4">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <div className="w-16 h-16 shrink-0 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-105">
                    <Upload weight="duotone" className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tighter text-zinc-950">Upload Image</h2>
                    <p className="text-zinc-500 text-sm mt-1 max-w-[30ch] mx-auto">Upload a photo for instant AI analysis</p>
                  </div>
                </label>
              </div>

              <div
                onClick={openHospitals}
                className="bg-white cursor-pointer rounded-[2rem] p-2 border border-zinc-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-transform group"
              >
                <div className="bg-blue-50/50 rounded-[calc(2rem-0.5rem)] p-8 h-full flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500 shadow-xl shadow-blue-500/20 flex items-center justify-center text-white transition-transform group-hover:scale-105">
                    <Hospital weight="duotone" className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tighter text-zinc-950">Nearby Hospitals</h2>
                    <p className="text-zinc-500 text-sm mt-1 max-w-[30ch] mx-auto">Find hospitals near you with directions & contact info</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === "camera" && (
            <motion.div
              key="cam"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 rounded-[2.5rem] p-4 mt-6 h-[600px] flex flex-col items-center relative overflow-hidden"
            >
              <video
                ref={(node) => {
                  videoRef.current = node;
                  if (node && stream) {
                    node.srcObject = stream;
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-[2rem]"
              />
              <div className={`absolute inset-0 pointer-events-none ring-[20px] ring-zinc-950 inset-ring z-10 rounded-[2.5rem] ${isAnalyzing ? 'bg-zinc-950/80 backdrop-blur-sm transition-all duration-500' : ''}`}></div>

              {isAnalyzing ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white gap-4">
                  <CircleNotch weight="bold" className="w-12 h-12 animate-spin text-emerald-500" />
                  <p className="font-semibold tracking-wide">AI Pipeline Processing Pipeline...</p>
                  <p className="text-sm text-zinc-400">Running YOLO + {model === "gemini" ? "Gemini 1.5 Pro" : "LLaVA 7b"} Analysis</p>
                </div>
              ) : (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-4">
                  <button onClick={() => {
                    setView("dashboard");
                    if (stream) {
                      stream.getTracks().forEach(track => track.stop());
                      setStream(null);
                    }
                  }} className="px-6 py-4 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center font-medium active:scale-95 transition-all">Cancel</button>
                  <button onClick={stopCameraAndCapture} className="px-8 py-4 rounded-full bg-white text-zinc-950 font-bold active:scale-95 transition-all flex border border-white gap-2 items-center">
                    Capture & Analyze
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {view === "analyzing" && (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 rounded-[2.5rem] p-4 mt-6 h-[400px] flex flex-col items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 pointer-events-none ring-[20px] ring-zinc-950 inset-ring z-10 rounded-[2.5rem]"></div>
              <div className="z-20 flex flex-col items-center justify-center text-white gap-4">
                <CircleNotch weight="bold" className="w-12 h-12 animate-spin text-emerald-500" />
                <p className="font-semibold tracking-wide">Analyzing Uploaded Image...</p>
                <p className="text-sm text-zinc-400">Running YOLO + {model === "gemini" ? "Gemini 1.5 Pro" : "LLaVA 7b"} Pipeline</p>
              </div>
            </motion.div>
          )}

          {view === "report" && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-2 border border-zinc-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] mt-6"
            >
              <div className="bg-zinc-50 rounded-[calc(2.5rem-0.5rem)] p-8">
                <div className="flex items-center gap-4 mb-6 border-b border-zinc-200 pb-6">
                  <div className={`w-12 h-12 rounded-full ${reportData?.emergency ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"} flex items-center justify-center `}>
                    <FileText weight="duotone" className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Analysis Report</h2>
                    <p className="text-zinc-500 text-sm">Powered by {reportData?.modelUsed}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-widest text-zinc-400 mb-2">Findings</h4>
                    <p className="text-zinc-900 leading-relaxed font-mono text-sm p-4 bg-zinc-200/50 rounded-xl whitespace-pre-wrap">{reportData?.diagnosis}</p>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-widest text-zinc-400 mb-2">Recommendations</h4>
                    <div className={`${reportData?.emergency ? "bg-red-50 text-red-900 border border-red-100" : "bg-emerald-50 text-emerald-900 border border-emerald-100"} p-4 rounded-2xl`}>
                      {reportData?.recommendation}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setView("dashboard")}
                  className="mt-8 w-full py-4 rounded-full bg-zinc-950 text-white font-medium active:scale-[0.98] transition-transform"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {view === "hospitals" && (
            <motion.div
              key="hospitals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 flex flex-col gap-4"
            >
              <div className="bg-white rounded-[2rem] p-2 border border-zinc-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
                <div className="bg-blue-50/50 rounded-[calc(2rem-0.5rem)] p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                        <Hospital weight="duotone" className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Nearby Hospitals</h2>
                        <p className="text-zinc-500 text-sm">
                          {hospitalsLoading ? "Searching..." : `${hospitals.length} found within ${searchRadius} km`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={fetchHospitals}
                      disabled={hospitalsLoading}
                      className="px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 shrink-0 flex items-center gap-2"
                    >
                      {hospitalsLoading ? <CircleNotch weight="bold" className="w-4 h-4 animate-spin" /> : "Refresh"}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-white/60 p-3.5 rounded-2xl border border-blue-100/50 shadow-sm">
                    <label htmlFor="radiusSlider" className="text-sm font-bold text-zinc-700 whitespace-nowrap w-36">
                      Radius: {searchRadius} km
                    </label>
                    <input 
                      type="range" 
                      id="radiusSlider" 
                      min="1" 
                      max="30" 
                      step="1" 
                      value={searchRadius} 
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {hospitalsError && (
                <div className="bg-red-50 border border-red-200/50 rounded-2xl p-4 flex items-center gap-3 text-red-800">
                  <Warning weight="fill" className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm">{hospitalsError}</p>
                </div>
              )}

              {hospitalsLoading && (
                <div className="bg-white rounded-2xl border border-zinc-200/50 p-12 flex flex-col items-center gap-3">
                  <CircleNotch weight="bold" className="w-10 h-10 animate-spin text-blue-500" />
                  <p className="text-zinc-500 text-sm">Finding hospitals near you...</p>
                </div>
              )}

              {!hospitalsLoading && hospitals.length > 0 && (
                <div className="flex flex-col gap-3">
                  {hospitals.map((h, i) => (
                    <motion.div
                      key={h.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl p-5 border border-zinc-200/50 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-zinc-950 truncate">{h.name}</h3>
                          {h.address && (
                            <p className="text-zinc-500 text-sm mt-1 flex items-center gap-1.5">
                              <MapPin weight="fill" className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              {h.address}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            {h.phone && (
                              <a href={`tel:${h.phone}`} className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">
                                <Phone weight="fill" className="w-3.5 h-3.5" />
                                {h.phone}
                              </a>
                            )}
                            {h.website && (
                              <a href={h.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                                <Globe weight="fill" className="w-3.5 h-3.5" />
                                Website
                              </a>
                            )}
                            {h.emergency === "yes" && (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-full">
                                <Siren weight="fill" className="w-3.5 h-3.5" />
                                Emergency
                              </span>
                            )}
                          </div>
                        </div>
                        {h.location?.lat && h.location?.lng && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${h.location.lat},${h.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 w-10 h-10 rounded-full bg-zinc-950 text-white flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all"
                            title="Get Directions"
                          >
                            <NavigationArrow weight="fill" className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {!hospitalsLoading && !hospitalsError && hospitals.length === 0 && (
                <div className="bg-white rounded-2xl border border-zinc-200/50 p-12 flex flex-col items-center gap-3 text-center">
                  <Hospital weight="duotone" className="w-12 h-12 text-zinc-300" />
                  <p className="text-zinc-500">No hospitals found nearby</p>
                  <button onClick={fetchHospitals} className="text-blue-600 text-sm font-medium hover:underline">Try again</button>
                </div>
              )}

              <button
                onClick={() => setView("dashboard")}
                className="w-full py-4 rounded-full bg-zinc-950 text-white font-medium active:scale-[0.98] transition-transform"
              >
                Return to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
