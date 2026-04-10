import { User } from '../models/user.model.js';

const activeLocations = new Map();

export const updateUserLocation = async (userId, longitude, latitude) => {
  activeLocations.set(userId.toString(), { longitude, latitude, timestamp: Date.now() });
  await User.findByIdAndUpdate(userId, { isActive: true });
};

export const getNearbyUsers = async (longitude, latitude, radiusKm = 5) => {
  const nearbyUsers = [];
  for (const [userId, location] of activeLocations.entries()) {
    const distance = calculateDistance(latitude, longitude, location.latitude, location.longitude);
    if (distance <= radiusKm) nearbyUsers.push({ userId, distance });
  }
  return nearbyUsers;
};

export const removeUserLocation = async (userId) => {
  activeLocations.delete(userId.toString());
  await User.findByIdAndUpdate(userId, { isActive: false });
};

export const getUserLocation = async (userId) => activeLocations.get(userId.toString()) || null;

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(degrees) { return degrees * (Math.PI / 180); }

setInterval(() => {
  const now = Date.now();
  for (const [userId, location] of activeLocations.entries()) {
    if (now - location.timestamp > 5 * 60 * 1000) {
      activeLocations.delete(userId);
      User.findByIdAndUpdate(userId, { isActive: false }).catch(console.error);
    }
  }
}, 60000);
