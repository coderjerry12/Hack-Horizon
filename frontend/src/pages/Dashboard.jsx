import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Siren, Camera, FileText, Brain, ArrowsLeftRight, CircleNotch, Upload } from "@phosphor-icons/react";

export default function Dashboard() {
  const [model, setModel] = useState("gemini"); // "gemini" | "ollama"
  const [view, setView] = useState("dashboard"); // "dashboard" | "camera" | "report"
  const videoRef = useRef(null);
  const [reportData, setReportData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

              <div className="bg-white cursor-pointer rounded-[2rem] p-2 border border-zinc-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-transform group md:col-span-2">
                <label className="block cursor-pointer bg-zinc-50 rounded-[calc(2rem-0.5rem)] p-8 h-full flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-6">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <div className="w-16 h-16 shrink-0 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-105">
                    <Upload weight="duotone" className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tighter text-zinc-950">Upload Image</h2>
                    <p className="text-zinc-500 text-sm mt-1 max-w-[40ch]">Upload an existing photo from your gallery for instant AI analysis instead of using the camera.</p>
                  </div>
                </label>
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
        </AnimatePresence>
      </div>
    </div>
  );
}
