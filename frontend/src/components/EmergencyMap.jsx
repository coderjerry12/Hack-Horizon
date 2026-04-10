import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Fix Leaflet default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom user marker (blue pulsing)
const userIcon = L.divIcon({
  html: `<div style="position:relative;width:24px;height:24px;">
    <div style="position:absolute;inset:0;background:#3b82f6;border-radius:50%;animation:pulse 2s infinite;opacity:0.4;"></div>
    <div style="position:absolute;inset:4px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.5);"></div>
  </div>
  <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:0.4}50%{transform:scale(2);opacity:0}}</style>`,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Hospital marker (red)
const hospitalIcon = L.divIcon({
  html: `<div style="width:28px;height:28px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.4);display:flex;align-items:center;justify-content:center;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>
  </div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Selected hospital marker (emerald)
const selectedHospitalIcon = L.divIcon({
  html: `<div style="width:36px;height:36px;background:#10b981;border-radius:50%;border:4px solid white;box-shadow:0 4px 12px rgba(16,185,129,0.5);display:flex;align-items:center;justify-content:center;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>
  </div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function FitBounds({ userLocation, hospitals, selectedHospital }) {
  const map = useMap();

  useEffect(() => {
    const points = [];
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    
    if (selectedHospital?.location?.lat) {
      points.push([selectedHospital.location.lat, selectedHospital.location.lng]);
    } else if (hospitals?.length) {
      hospitals.slice(0, 5).forEach((h) => {
        if (h.location?.lat && h.location?.lng) {
          points.push([h.location.lat, h.location.lng]);
        }
      });
    }

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [map, userLocation, hospitals, selectedHospital]);

  return null;
}

/**
 * EmergencyMap component
 * @param {{ userLocation: {lat,lng}, hospitals: Array, selectedHospital: object|null, height: string }} props
 */
export default function EmergencyMap({ userLocation, hospitals = [], selectedHospital = null, height = "300px" }) {
  if (!userLocation) return null;

  const center = [userLocation.lat, userLocation.lng];

  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm" style={{ height }}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location */}
        <Marker position={center} icon={userIcon}>
          <Popup>
            <div style={{ fontWeight: 600, fontSize: 13 }}>📍 Your Location</div>
            <div style={{ fontSize: 11, color: "#666" }}>
              {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
            </div>
          </Popup>
        </Marker>

        {/* Hospital Markers */}
        {hospitals.map((h, i) => {
          if (!h.location?.lat || !h.location?.lng) return null;
          const isSelected = selectedHospital && h.id === selectedHospital.id;
          return (
            <Marker
              key={h.id || i}
              position={[h.location.lat, h.location.lng]}
              icon={isSelected ? selectedHospitalIcon : hospitalIcon}
            >
              <Popup>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{h.name}</div>
                {h.address && <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>{h.address}</div>}
                {h.phone && <div style={{ fontSize: 11 }}>📞 {h.phone}</div>}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${h.location.lat},${h.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "#3b82f6", display: "block", marginTop: 6 }}
                >
                  Get Directions →
                </a>
              </Popup>
            </Marker>
          );
        })}

        <FitBounds userLocation={userLocation} hospitals={hospitals} selectedHospital={selectedHospital} />
      </MapContainer>
    </div>
  );
}
