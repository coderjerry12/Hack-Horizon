import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChartBar, Users, Siren, MapPin, Gear, SignOut, CircleNotch,
  Warning, Trash, ShieldCheck, MagnifyingGlass, ArrowLeft,
  ArrowRight, UserCircle, Hospital, Clock, Eye
} from "@phosphor-icons/react";
import EmergencyMap from "../components/EmergencyMap";

const BACKEND_URL = "http://localhost:8000";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: ChartBar },
  { id: "users", label: "Users", icon: Users },
  { id: "events", label: "SOS Events", icon: Siren },
  { id: "map", label: "Live Map", icon: MapPin },
  { id: "settings", label: "Settings", icon: Gear },
];

// ─── Helpers ──────────────────────────────────────────

function useAdminFetch(endpoint, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || "Failed to fetch");
      }
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refetch(); }, deps);
  return { data, loading, error, refetch };
}

function StatCard({ label, value, color = "bg-zinc-100 text-zinc-800", icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200/50 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</span>
        {Icon && <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center`}>
          <Icon weight="duotone" className="w-4 h-4" />
        </div>}
      </div>
      <p className="text-3xl font-bold tracking-tight text-zinc-950">{value ?? "—"}</p>
    </div>
  );
}

// ─── Dashboard View ──────────────────────────────────

function DashboardView() {
  const { data: stats, loading, error } = useAdminFetch("/api/v1/admin/stats");

  if (loading) return <LoadingState text="Loading dashboard..." />;
  if (error) return <ErrorState text={error} />;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="bg-blue-100 text-blue-600" />
        <StatCard label="Total SOS Events" value={stats.totalSosEvents} icon={Siren} color="bg-red-100 text-red-600" />
        <StatCard label="Today's Alerts" value={stats.todayEvents} icon={Clock} color="bg-amber-100 text-amber-600" />
        <StatCard label="Last 7 Days" value={stats.last7DaysEvents} icon={ChartBar} color="bg-emerald-100 text-emerald-600" />
      </div>

      {/* Source Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200/50 p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">By Source</h3>
          <div className="flex flex-col gap-3">
            {Object.entries(stats.sourceBreakdown || {}).map(([source, count]) => (
              <div key={source} className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-700 capitalize">{source.replace("_", " ")}</span>
                <span className="text-sm font-bold px-3 py-1 rounded-full bg-zinc-100">{count}</span>
              </div>
            ))}
            {Object.keys(stats.sourceBreakdown || {}).length === 0 && (
              <p className="text-sm text-zinc-400">No events yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/50 p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">By Status</h3>
          <div className="flex flex-col gap-3">
            {Object.entries(stats.statusBreakdown || {}).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-700">{status}</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  status === "DISPATCHED" ? "bg-red-100 text-red-700" :
                  status === "RESOLVED" ? "bg-emerald-100 text-emerald-700" :
                  "bg-zinc-100 text-zinc-700"
                }`}>{count}</span>
              </div>
            ))}
            {Object.keys(stats.statusBreakdown || {}).length === 0 && (
              <p className="text-sm text-zinc-400">No events yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-2xl border border-zinc-200/50 p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Recent SOS Events</h3>
        {stats.recentEvents?.length > 0 ? (
          <div className="flex flex-col gap-3">
            {stats.recentEvents.map((event) => (
              <div key={event._id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <Siren weight="fill" className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{event.userId?.fullName || event.userId?.username || "Bystander"}</p>
                    <p className="text-[11px] text-zinc-400">{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-200">{event.source}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    event.status === "DISPATCHED" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                  }`}>{event.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No recent events</p>
        )}
      </div>
    </div>
  );
}

// ─── Users View ──────────────────────────────────────

function UsersView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const { data, loading, error, refetch } = useAdminFetch(`/api/v1/admin/users?page=${page}&search=${search}`, [page, search]);
  const [expandedUser, setExpandedUser] = useState(null);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleDelete = async (userId, username) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        refetch();
      } else {
        alert(json.message || "Delete failed");
      }
    } catch {
      alert("Server error");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (json.success) {
        refetch();
      } else {
        alert(json.message);
      }
    } catch {
      alert("Server error");
    }
  };

  if (loading) return <LoadingState text="Loading users..." />;
  if (error) return <ErrorState text={error} />;

  const { users, pagination } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <span className="text-sm text-zinc-400">{pagination.total} users total</span>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by name, email, or username..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
          />
        </div>
        <button onClick={handleSearch} className="px-5 py-3 rounded-xl bg-zinc-950 text-white text-sm font-medium active:scale-95 transition-transform">
          Search
        </button>
      </div>

      {/* User List */}
      <div className="flex flex-col gap-3">
        {users.map((user) => (
          <div key={user._id} className="bg-white rounded-2xl border border-zinc-200/50 shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedUser(expandedUser === user._id ? null : user._id)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600">
                  <UserCircle weight="duotone" className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{user.fullName || user.username}</span>
                    {user.role === "admin" && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Admin</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye weight="duotone" className="w-4 h-4 text-zinc-400" />
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedUser === user._id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 border-t border-zinc-100 pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-zinc-400 text-xs block">Username</span><span className="font-medium">{user.username}</span></div>
                      <div><span className="text-zinc-400 text-xs block">Blood Group</span><span className="font-medium">{user.bloodGroup || "—"}</span></div>
                      <div><span className="text-zinc-400 text-xs block">Medical Conditions</span><span className="font-medium">{user.medicalConditions || "—"}</span></div>
                      <div><span className="text-zinc-400 text-xs block">Emergency Contact</span><span className="font-medium">{user.emergencyContactName || "—"}</span></div>
                      <div><span className="text-zinc-400 text-xs block">Emergency Phone</span><span className="font-medium">{user.emergencyContactPhone || "—"}</span></div>
                      <div><span className="text-zinc-400 text-xs block">Emergency Email</span><span className="font-medium">{user.emergencyContactEmail || "—"}</span></div>
                      <div><span className="text-zinc-400 text-xs block">Joined</span><span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span></div>
                      <div><span className="text-zinc-400 text-xs block">Email Verified</span><span className="font-medium">{user.isEmailVerified ? "✓ Yes" : "✗ No"}</span></div>
                      <div><span className="text-zinc-400 text-xs block">Setup Complete</span><span className="font-medium">{user.isSetupComplete ? "✓ Yes" : "✗ No"}</span></div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {user.role === "user" ? (
                        <button onClick={() => handleRoleChange(user._id, "admin")} className="px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 text-xs font-bold hover:bg-violet-200 transition-colors">
                          <ShieldCheck weight="bold" className="w-3 h-3 inline mr-1" /> Promote to Admin
                        </button>
                      ) : (
                        <button onClick={() => handleRoleChange(user._id, "user")} className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors">
                          Demote to User
                        </button>
                      )}
                      <button onClick={() => handleDelete(user._id, user.username)} className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 transition-colors">
                        <Trash weight="bold" className="w-3 h-3 inline mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-full bg-zinc-200 text-zinc-700 text-sm font-medium disabled:opacity-40 active:scale-95 transition-all"
          >
            <ArrowLeft weight="bold" className="w-4 h-4" />
          </button>
          <span className="text-sm text-zinc-500">{page} / {pagination.totalPages}</span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-full bg-zinc-200 text-zinc-700 text-sm font-medium disabled:opacity-40 active:scale-95 transition-all"
          >
            <ArrowRight weight="bold" className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Events View ──────────────────────────────────────

function EventsView() {
  const [page, setPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const queryParams = `page=${page}${sourceFilter ? `&source=${sourceFilter}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`;
  const { data, loading, error } = useAdminFetch(`/api/v1/admin/sos-events?${queryParams}`, [page, sourceFilter, statusFilter]);

  if (loading) return <LoadingState text="Loading SOS events..." />;
  if (error) return <ErrorState text={error} />;

  const { events, pagination } = data;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">SOS Event Log</h2>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none"
        >
          <option value="">All Sources</option>
          <option value="user">Manual SOS</option>
          <option value="crash_detection">Crash Detection</option>
          <option value="ai_detection">AI Detection</option>
          <option value="bystander">Bystander</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <span className="text-sm text-zinc-400 self-center">{pagination.total} events</span>
      </div>

      {/* Event List */}
      <div className="flex flex-col gap-3">
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border text-center">
            <Siren weight="duotone" className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
            <p className="text-zinc-400">No events match the filters</p>
          </div>
        ) : events.map((event) => (
          <div key={event._id} className="bg-white rounded-2xl border border-zinc-200/50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Siren weight="fill" className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{event.userId?.fullName || event.userId?.username || "Bystander Report"}</p>
                  <p className="text-[11px] text-zinc-400">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap justify-end">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  event.source === "crash_detection" ? "bg-orange-50 text-orange-700 border-orange-200" :
                  event.source === "bystander" ? "bg-purple-50 text-purple-700 border-purple-200" :
                  event.source === "ai_detection" ? "bg-cyan-50 text-cyan-700 border-cyan-200" :
                  "bg-red-50 text-red-700 border-red-200"
                }`}>{event.source?.replace("_", " ")}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  event.status === "DISPATCHED" ? "bg-red-100 text-red-700" :
                  event.status === "RESOLVED" ? "bg-emerald-100 text-emerald-700" :
                  "bg-zinc-100 text-zinc-700"
                }`}>{event.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-zinc-400 block">Location</span>
                <span className="font-mono">{event.location?.lat?.toFixed(4)}, {event.location?.lng?.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Hospital</span>
                <span className="font-medium">{event.hospital?.name || "—"}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">ETA</span>
                <span className="font-medium">{event.routing?.travelTimeInMinutes ? `${event.routing.travelTimeInMinutes} min` : "—"}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Contact Notified</span>
                <span className="font-medium">{event.emergencyContactNotified ? "✓ Yes" : "✗ No"}</span>
              </div>
            </div>

            {/* User Medical Info */}
            {event.userId?.bloodGroup && (
              <div className="mt-3 pt-3 border-t border-zinc-100 flex gap-4 text-xs text-zinc-500">
                <span>🩸 {event.userId.bloodGroup}</span>
                {event.userId.medicalConditions && <span>💊 {event.userId.medicalConditions}</span>}
                {event.userId.emergencyContactPhone && <span>📞 {event.userId.emergencyContactPhone}</span>}
              </div>
            )}

            {/* Bystander Info */}
            {event.bystanderInfo?.description && (
              <div className="mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
                <span className="font-medium">Bystander Note:</span> {event.bystanderInfo.description}
                {event.bystanderInfo.phone && <span className="ml-2">📞 {event.bystanderInfo.phone}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 rounded-full bg-zinc-200 text-zinc-700 text-sm font-medium disabled:opacity-40 active:scale-95 transition-all">
            <ArrowLeft weight="bold" className="w-4 h-4" />
          </button>
          <span className="text-sm text-zinc-500">{page} / {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 rounded-full bg-zinc-200 text-zinc-700 text-sm font-medium disabled:opacity-40 active:scale-95 transition-all">
            <ArrowRight weight="bold" className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Live Map View ────────────────────────────────────

function LiveMapView() {
  const { data, loading, error } = useAdminFetch("/api/v1/admin/recent-emergencies");

  if (loading) return <LoadingState text="Loading emergency map..." />;
  if (error) return <ErrorState text={error} />;

  const events = data?.events || [];

  // Convert events into a format EmergencyMap can display
  const hospitalMarkers = events
    .filter((e) => e.hospital?.location?.lat)
    .map((e) => ({
      ...e.hospital,
      name: `${e.hospital.name} — ${e.userId?.fullName || e.userId?.username || "Bystander"} (${new Date(e.createdAt).toLocaleTimeString()})`,
    }));

  // Center on the first event or a default
  const center = events.length > 0
    ? { lat: events[0].location.lat, lng: events[0].location.lng }
    : { lat: 20.5937, lng: 78.9629 }; // India center

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Live Emergency Map</h2>
        <span className="text-sm text-zinc-400">{events.length} events in last 24h</span>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200/50 shadow-sm overflow-hidden">
        {events.length > 0 ? (
          <EmergencyMap
            userLocation={center}
            hospitals={hospitalMarkers}
            height="500px"
          />
        ) : (
          <div className="h-[500px] flex flex-col items-center justify-center text-center">
            <MapPin weight="duotone" className="w-16 h-16 text-zinc-200 mb-4" />
            <p className="text-zinc-500 font-medium">No emergencies in the last 24 hours</p>
            <p className="text-zinc-400 text-sm">Active alerts will appear on this map in real-time</p>
          </div>
        )}
      </div>

      {/* Event Legend */}
      {events.length > 0 && (
        <div className="flex flex-col gap-2">
          {events.slice(0, 10).map((event) => (
            <div key={event._id} className="bg-white rounded-xl border border-zinc-200/50 p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-medium">{event.userId?.fullName || event.userId?.username || "Bystander"}</span>
                <span className="text-zinc-400 text-xs">{new Date(event.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hospital weight="duotone" className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-zinc-500">{event.hospital?.name || "—"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings View ────────────────────────────────────

function SettingsView() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">System Configuration</h2>

      {/* System Health */}
      <div className="bg-white rounded-2xl border border-zinc-200/50 p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthItem label="Node.js Backend" endpoint="/api/v1/healthcheck" />
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-semibold text-zinc-700">Notification Service</span>
            </div>
            <p className="text-[11px] text-zinc-400">Mailtrap (Node.js)</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-semibold text-zinc-700">AI Analysis</span>
            </div>
            <p className="text-[11px] text-zinc-400">Python Flask + YOLO + Gemini</p>
          </div>
        </div>
      </div>

      {/* Detection Thresholds */}
      <div className="bg-white rounded-2xl border border-zinc-200/50 p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Detection Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-xs text-zinc-400 block mb-1">Crash Detection Threshold</span>
            <span className="font-bold text-zinc-950 text-lg">30 m/s²</span>
            <p className="text-[11px] text-zinc-400 mt-1">Accelerometer impact force threshold (DeviceMotion API)</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-xs text-zinc-400 block mb-1">Crash Debounce Period</span>
            <span className="font-bold text-zinc-950 text-lg">30 seconds</span>
            <p className="text-[11px] text-zinc-400 mt-1">Minimum time between two crash triggers</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-xs text-zinc-400 block mb-1">SOS Cancel Window</span>
            <span className="font-bold text-zinc-950 text-lg">5 seconds</span>
            <p className="text-[11px] text-zinc-400 mt-1">Time the user has to cancel auto-triggered SOS</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-xs text-zinc-400 block mb-1">Hospital Search Radius</span>
            <span className="font-bold text-zinc-950 text-lg">8 km</span>
            <p className="text-[11px] text-zinc-400 mt-1">Overpass API search radius for SOS</p>
          </div>
        </div>
      </div>

      {/* Fallback Hospital */}
      <div className="bg-white rounded-2xl border border-zinc-200/50 p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Fallback Hospital</h3>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <Hospital weight="duotone" className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-zinc-950">Manipal Hospital</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600">
            <div><span className="text-zinc-400">Phone:</span> +91-1800-102-9999</div>
            <div><span className="text-zinc-400">Email:</span> emergency@manipalhospitals.com</div>
            <div><span className="text-zinc-400">Offset:</span> ~3km from user location</div>
            <div><span className="text-zinc-400">ETA:</span> ~8 minutes (estimated)</div>
          </div>
          <p className="text-[11px] text-amber-700 mt-3">This hospital is used as a fallback when Overpass API is down or returns no results.</p>
        </div>
      </div>
    </div>
  );
}

function HealthItem({ label, endpoint }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}${endpoint}`);
        setStatus(res.ok ? "online" : "error");
      } catch {
        setStatus("offline");
      }
    })();
  }, []);

  const colors = {
    checking: "bg-amber-500",
    online: "bg-emerald-500",
    error: "bg-red-500",
    offline: "bg-red-500",
  };

  return (
    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${colors[status]} ${status === "checking" ? "animate-pulse" : ""}`} />
        <span className="text-xs font-semibold text-zinc-700">{label}</span>
      </div>
      <p className="text-[11px] text-zinc-400 capitalize">{status}</p>
    </div>
  );
}

// ─── Shared States ────────────────────────────────────

function LoadingState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <CircleNotch weight="bold" className="w-10 h-10 animate-spin text-zinc-400" />
      <p className="text-zinc-500 text-sm">{text}</p>
    </div>
  );
}

function ErrorState({ text }) {
  return (
    <div className="bg-red-50 border border-red-200/50 rounded-2xl p-6 flex items-center gap-3 text-red-800">
      <Warning weight="fill" className="w-5 h-5 text-red-500 shrink-0" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [verifying, setVerifying] = useState(true);

  // Verify admin access
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) { navigate("/login"); return; }

        const res = await fetch(`${BACKEND_URL}/api/v1/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          navigate("/dashboard");
          return;
        }
      } catch {
        navigate("/dashboard");
      } finally {
        setVerifying(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  if (verifying) {
    return (
      <div className="min-h-[100dvh] bg-[#f9fafb] flex items-center justify-center">
        <CircleNotch weight="bold" className="w-10 h-10 animate-spin text-zinc-400" />
      </div>
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardView />;
      case "users": return <UsersView />;
      case "events": return <EventsView />;
      case "map": return <LiveMapView />;
      case "settings": return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f9fafb] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-950 text-white flex flex-col shrink-0 sticky top-0 h-[100dvh]">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
              <ShieldCheck weight="fill" className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight">HackHorizon</h1>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-white text-zinc-950"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon weight={active ? "fill" : "duotone"} className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all w-full"
          >
            <ArrowLeft weight="bold" className="w-5 h-5" />
            Back to App
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full"
          >
            <SignOut weight="bold" className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
