// SOS Mock Test (No API Key Needed)
// Simulates exact SOS flow with mock data
// Run: node test-sos-mock.js

const toRad = (value) => (value * Math.PI) / 180;

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Mock hospitals (simulating Overpass API results)
const mockHospitals = [
  { id: 1, name: "NYU Langone", lat: 40.7614, lng: -73.9776 },
  { id: 2, name: "Mount Sinai", lat: 40.7850, lng: -73.9735 },
  { id: 3, name: "Bellevue Hospital", lat: 40.7400, lng: -73.9754 },
  { id: 4, name: "Columbia Medical", lat: 40.8105, lng: -73.9626 },
  { id: 5, name: "Lenox Hill", lat: 40.7738, lng: -73.9572 },
  { id: 6, name: "Memorial Sloan", lat: 40.7484, lng: -73.9857 },
  { id: 7, name: "NYC Eye", lat: 40.7688, lng: -73.9654 },
];

// Mock TomTom responses (traffic-aware travel times)
const mockTomTomTimes = {
  1: { minutes: 12, reason: "Traffic jam on FDR" },
  2: { minutes: 18, reason: "Heavy traffic uptown" },
  3: { minutes: 7, reason: "Clear roads downtown" }, // ✅ WINNER
  4: { minutes: 22, reason: "Construction zone" },
  5: { minutes: 15, reason: "Moderate traffic" },
  6: { minutes: 14, reason: "Normal traffic" },
  7: { minutes: 19, reason: "Bridge congestion" },
};

console.log("🚨 SOS MOCK TEST (NYC - Rush Hour)\n");
console.log("=".repeat(70) + "\n");

// User location (Times Square area)
const userLat = 40.7580;
const userLng = -73.9855;

console.log(`📍 User Location: (${userLat}, ${userLng})`);
console.log(`⏰ Time: 5:30 PM (Rush Hour with Heavy Traffic)\n`);

// STEP 1: Calculate straight-line distances
console.log("STEP 1️⃣  - Haversine Distance Calculation");
console.log("-".repeat(70));

const hospitalsWithDistance = mockHospitals.map((h) => ({
  ...h,
  straightLineDistance: calculateDistance(userLat, userLng, h.lat, h.lng),
}));

hospitalsWithDistance.forEach((h) => {
  console.log(
    `  ${h.id}. ${h.name.padEnd(20)} → ${h.straightLineDistance.toFixed(2)} km`
  );
});

// STEP 2: Filter top 5
console.log("\nSTEP 2️⃣  - Filter Top 5 by Distance");
console.log("-".repeat(70));

const top5 = hospitalsWithDistance
  .sort((a, b) => a.straightLineDistance - b.straightLineDistance)
  .slice(0, 5);

top5.forEach((h, i) => {
  console.log(
    `  ${i + 1}. ${h.name.padEnd(20)} → ${h.straightLineDistance.toFixed(2)} km  ${
      i === 0 ? "⭐ (Closest)" : ""
    }`
  );
});

// STEP 3: TomTom real traffic times
console.log("\nSTEP 3️⃣  - TomTom Real Traffic Routing");
console.log("-".repeat(70));

const topWithTraffic = top5
  .map((h) => ({
    ...h,
    travelMinutes: mockTomTomTimes[h.id].minutes,
    reason: mockTomTomTimes[h.id].reason,
  }))
  .sort((a, b) => a.travelMinutes - b.travelMinutes);

topWithTraffic.forEach((h) => {
  console.log(
    `  ${h.name.padEnd(20)} → ${String(h.travelMinutes).padEnd(2)} min (${h.reason})`
  );
});

// STEP 4: Select fastest
console.log("\nSTEP 4️⃣  - Final Decision");
console.log("=".repeat(70));

const best = topWithTraffic[0];

console.log(`\n✅ SELECTED: ${best.name}`);
console.log(`\n📊 Comparison:`);
console.log(`  Straight-line distance: ${best.straightLineDistance.toFixed(2)} km`);
console.log(`  Real driving time:      ${best.travelMinutes} minutes`);
console.log(`  Reason:                 ${best.reason}\n`);

// Show alternatives
console.log("Why not the others?");
topWithTraffic.forEach((h, i) => {
  if (i === 0) return;
  const diff = h.travelMinutes - best.travelMinutes;
  console.log(
    `  ❌ ${h.name.padEnd(20)} → ${diff} min slower (${h.reason})`
  );
});

console.log("\n" + "=".repeat(70));
console.log(`\n🏥 SOS DISPATCH TO: ${best.name}`);
console.log(`⏱️  ETA: ${best.travelMinutes} minutes`);
console.log(`📍 Address: Hospital at (${best.lat}, ${best.lng})`);
console.log(`📧 Emergency contact notified with hospital details\n`);

// Show why this is better than just using distance
console.log("=".repeat(70));
console.log("\n💡 Why Traffic-Aware is Better:\n");

const closestByDistance = hospitalsWithDistance[0];
console.log(`Old System (Distance only):`);
console.log(`  → Would send to: ${closestByDistance.name}`);
console.log(
  `  → Distance: ${closestByDistance.straightLineDistance.toFixed(2)} km`
);
console.log(
  `  → But with traffic: ${mockTomTomTimes[closestByDistance.id].minutes} minutes 😭`
);

console.log(`\nNew System (Traffic-Aware):`);
console.log(`  → Sends to: ${best.name}`);
console.log(`  → Distance: ${best.straightLineDistance.toFixed(2)} km`);
console.log(`  → With traffic: ${best.travelMinutes} minutes ✅`);

const timeSaved =
  mockTomTomTimes[closestByDistance.id].minutes - best.travelMinutes;
console.log(`\n🎉 TIME SAVED: ${timeSaved} minutes = POTENTIALLY LIVES SAVED! 💚\n`);
