import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ClockCounterClockwise, Hospital, MapPin, NavigationArrow, ArrowLeft, Siren, CircleNotch, Warning } from "@phosphor-icons/react";

const BACKEND_URL = "http://localhost:8000";

export default function History() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Please log in to view history.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/v1/history?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setEvents(data.data.events);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || "Failed to load history");
      }
    } catch (err) {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sourceLabel = (source) => {
    switch (source) {
      case "crash_detection": return "Auto-Detected";
      case "bystander": return "Bystander Report";
      default: return "Manual SOS";
    }
  };

  const sourceColor = (source) => {
    switch (source) {
      case "crash_detection": return "bg-orange-50 text-orange-700 border-orange-200";
      case "bystander": return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-red-50 text-red-700 border-red-200";
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f9fafb] p-6 pt-10 text-zinc-950 font-sans">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-center gap-4 bg-white p-4 rounded-full border border-black/5 shadow-sm">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 active:scale-95 transition-all"
          >
            <ArrowLeft weight="bold" className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <ClockCounterClockwise weight="duotone" className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="font-semibold tracking-tight">SOS History</span>
              <span className="text-xs text-zinc-400 ml-2">{pagination.total} events</span>
            </div>
          </div>
        </header>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-zinc-200/50 p-16 flex flex-col items-center gap-3">
            <CircleNotch weight="bold" className="w-10 h-10 animate-spin text-amber-500" />
            <p className="text-zinc-500 text-sm">Loading history...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200/50 rounded-2xl p-5 flex items-center gap-3 text-red-800">
            <Warning weight="fill" className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Events */}
        {!loading && !error && events.length === 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200/50 p-16 flex flex-col items-center gap-3 text-center">
            <Siren weight="duotone" className="w-14 h-14 text-zinc-200" />
            <p className="text-zinc-500 font-medium">No SOS events yet</p>
            <p className="text-zinc-400 text-sm">Your emergency history will appear here</p>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div className="flex flex-col gap-3">
            {events.map((event, i) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl p-5 border border-zinc-200/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <Siren weight="fill" className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-950 text-sm">SOS Alert</h3>
                      <p className="text-xs text-zinc-400">{formatDate(event.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${sourceColor(event.source)}`}>
                    {sourceLabel(event.source)}
                  </span>
                </div>

                {/* Hospital Info */}
                {event.hospital && (
                  <div className="bg-zinc-50 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Hospital weight="duotone" className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-sm text-zinc-950">{event.hospital.name}</span>
                    </div>
                    {event.hospital.address && (
                      <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1">
                        <MapPin weight="fill" className="w-3 h-3 text-zinc-400" />
                        {event.hospital.address}
                      </p>
                    )}
                    {event.routing && (
                      <p className="text-xs text-zinc-500">
                        🕐 {event.routing.travelTimeInMinutes} min • {event.routing.distance} km
                      </p>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                    <span>📍 {event.location?.lat?.toFixed(4)}, {event.location?.lng?.toFixed(4)}</span>
                    {event.emergencyContactNotified && (
                      <span className="text-emerald-600">✓ Notified</span>
                    )}
                  </div>
                  {event.hospital?.location?.lat && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${event.hospital.location.lat},${event.hospital.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all"
                      title="Directions"
                    >
                      <NavigationArrow weight="fill" className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-3">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchHistory(pagination.page - 1)}
              className="px-4 py-2 rounded-full bg-zinc-200 text-zinc-700 text-sm font-medium disabled:opacity-40 hover:bg-zinc-300 active:scale-95 transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-zinc-500">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchHistory(pagination.page + 1)}
              className="px-4 py-2 rounded-full bg-zinc-200 text-zinc-700 text-sm font-medium disabled:opacity-40 hover:bg-zinc-300 active:scale-95 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
