import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Siren, MapPin, Phone, Hospital, NavigationArrow, CircleNotch, Warning, ArrowLeft } from "@phosphor-icons/react";

const BACKEND_URL = "http://localhost:8000";

export default function BystanderSOS() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [description, setDescription] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setError("Could not access your location: " + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  const handleReport = async () => {
    if (!userLocation) {
      setError("Location is required. Please allow location permissions.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/public-sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: userLocation.lat,
          lng: userLocation.lng,
          description,
          reporterPhone,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || "Failed to submit report");
      }
    } catch (err) {
      setError("Could not connect to emergency server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f9fafb] p-6 pt-10 text-zinc-950 font-sans">
      <div className="max-w-lg mx-auto flex flex-col gap-6">

        {/* Header */}
        <header className="flex items-center gap-4 bg-white p-4 rounded-full border border-black/5 shadow-sm">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 active:scale-95 transition-all"
          >
            <ArrowLeft weight="bold" className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <Siren weight="duotone" className="w-5 h-5 text-red-600" />
            </div>
            <span className="font-semibold tracking-tight">Report Emergency</span>
          </div>
        </header>

        {!result ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-5"
          >
            {/* Info Banner */}
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                  <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white relative z-10">
                    <Siren weight="fill" className="w-8 h-8" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-red-950 mb-2">Witness an Emergency?</h2>
              <p className="text-red-800/80 text-sm">Report it here. No account needed. We'll find the nearest hospital and alert emergency services.</p>
            </div>

            {/* Location Status */}
            <div className={`rounded-2xl p-4 border flex items-center gap-3 ${
              locating ? "bg-amber-50 border-amber-200" :
              userLocation ? "bg-emerald-50 border-emerald-200" :
              "bg-red-50 border-red-200"
            }`}>
              {locating ? (
                <>
                  <CircleNotch weight="bold" className="w-5 h-5 animate-spin text-amber-600" />
                  <span className="text-sm text-amber-800 font-medium">Getting your location...</span>
                </>
              ) : userLocation ? (
                <>
                  <MapPin weight="fill" className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-emerald-800 font-medium">
                    Location acquired ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
                  </span>
                </>
              ) : (
                <>
                  <Warning weight="fill" className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-800 font-medium">Location unavailable</span>
                </>
              )}
            </div>

            {/* Optional Description */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200/50 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-zinc-700">What happened? (optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Car accident on main road, person injured..."
                    rows={3}
                    className="px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all text-sm resize-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-zinc-700">Your phone (optional)</label>
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200/50 rounded-2xl p-4 flex items-center gap-3 text-red-800">
                <Warning weight="fill" className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleReport}
              disabled={loading || !userLocation}
              className="w-full py-4 rounded-full bg-red-600 text-white font-bold text-lg active:scale-[0.97] transition-transform disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-red-600/20"
            >
              {loading ? (
                <>
                  <CircleNotch weight="bold" className="w-5 h-5 animate-spin" />
                  Finding nearest hospital...
                </>
              ) : (
                <>
                  <Siren weight="fill" className="w-5 h-5" />
                  Report Emergency Now
                </>
              )}
            </button>
          </motion.div>
        ) : (
          /* Result View */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-4"
          >
            {/* Success */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-emerald-900 mb-1">Emergency Reported!</h2>
              <p className="text-emerald-700 text-sm">Emergency services have been alerted</p>
            </div>

            {/* Hospital Info */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200/50 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                  <Hospital weight="duotone" className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-950">{result.hospital.name}</h3>
                  <p className="text-blue-600 text-xs font-semibold">Nearest Hospital</p>
                </div>
              </div>

              {result.hospital.address && (
                <p className="text-sm text-zinc-500 flex items-center gap-1.5 mb-2">
                  <MapPin weight="fill" className="w-3.5 h-3.5 text-zinc-400" />
                  {result.hospital.address}
                </p>
              )}

              {result.hospital.phone && (
                <a href={`tel:${result.hospital.phone}`} className="text-sm text-emerald-600 flex items-center gap-1.5 mb-4 font-medium">
                  <Phone weight="fill" className="w-3.5 h-3.5" />
                  {result.hospital.phone}
                </a>
              )}

              {result.routing && (
                <div className="bg-zinc-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Estimated Travel</span>
                  <span className="font-bold text-red-600">{result.routing.travelTimeInMinutes} min • {result.routing.distance} km</span>
                </div>
              )}

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${result.hospital.location.lat},${result.hospital.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-4 py-3 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"
              >
                <NavigationArrow weight="fill" className="w-4 h-4" />
                Get Directions
              </a>
            </div>

            <button
              onClick={() => navigate("/")}
              className="w-full py-4 rounded-full bg-zinc-950 text-white font-medium active:scale-[0.98] transition-transform"
            >
              Done
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
