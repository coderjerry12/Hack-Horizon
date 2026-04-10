// Quick TomTom API Test Script
// Run: node test-tomtom.js

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

if (!TOMTOM_API_KEY) {
  console.error("❌ TOMTOM_API_KEY not found in .env");
  process.exit(1);
}

console.log("🧪 Testing TomTom Routing API...\n");

// Test coordinates: New York
const userLat = 40.7128;
const userLng = -74.0060;

// Hospital coordinates (example in NYC)
const hospitals = [
  {
    name: "NYU Langone Hospital",
    lat: 40.7614,
    lng: -73.9776,
  },
  {
    name: "Mount Sinai Hospital",
    lat: 40.7850,
    lng: -73.9735,
  },
  {
    name: "Bellevue Hospital",
    lat: 40.7400,
    lng: -73.9754,
  },
];

async function testTomTom(hospital) {
  try {
    console.log(`📍 Testing: ${hospital.name}`);
    
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${userLat},${userLng}:${hospital.lat},${hospital.lng}/json`;

    console.log(`   URL: ${url}`);
    console.log(`   Key Used: ${TOMTOM_API_KEY.substring(0, 5)}...`);

    const response = await axios.get(url, {
      params: {
        key: TOMTOM_API_KEY,
        routeType: "fastest",
        computeTravelTimeFor: "all",
        traffic: "true",
      },
      timeout: 10000,
    });

    if (response.data?.routes?.[0]) {
      const route = response.data.routes[0];
      const travelSeconds = route.summary.travelTimeInSeconds;
      const distance = route.summary.lengthInMeters / 1000; // km
      const minutes = Math.round(travelSeconds / 60);

      console.log(`   ✅ SUCCESS`);
      console.log(`   ⏱️  Travel Time: ${minutes} minutes (${travelSeconds}s)`);
      console.log(`   📏 Distance: ${distance.toFixed(2)} km`);
      console.log(`   🛣️  Route Points: ${route.legs[0].points.length} waypoints\n`);
      
      return { success: true, minutes, distance };
    } else {
      console.log(`   ❌ No routes in response\n`);
      return { success: false };
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`   ❌ AUTHENTICATION ERROR - Invalid API Key\n`);
    } else if (error.response?.status === 400) {
      console.log(`   ❌ BAD REQUEST - Check coordinates\n`);
    } else if (error.code === "ECONNABORTED") {
      console.log(`   ❌ TIMEOUT - TomTom server slow\n`);
    } else {
      console.log(`   ❌ ERROR: ${error.message}\n`);
    }
    return { success: false };
  }
}

async function runAllTests() {
  console.log(`🏥 From: User (${userLat}, ${userLng}) in NYC\n`);
  console.log("=".repeat(60) + "\n");

  const results = [];

  for (const hospital of hospitals) {
    const result = await testTomTom(hospital);
    results.push({ ...hospital, ...result });
    await new Promise((r) => setTimeout(r, 500)); // Rate limit friendly
  }

  console.log("=".repeat(60));
  console.log("\n📊 RESULTS SUMMARY:\n");

  results.forEach((r) => {
    if (r.success) {
      console.log(`✅ ${r.name}: ${r.minutes} min (${r.distance.toFixed(2)} km)`);
    } else {
      console.log(`❌ ${r.name}: Failed`);
    }
  });

  const successful = results.filter((r) => r.success);
  if (successful.length === results.length) {
    console.log(`\n🎉 All ${results.length} tests passed! TomTom API is working!\n`);
  } else {
    console.log(`\n⚠️  ${successful.length}/${results.length} tests passed\n`);
  }
}

runAllTests().catch(console.error);
