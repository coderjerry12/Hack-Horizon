import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for automatic crash/impact detection using the DeviceMotion API.
 * 
 * Monitors accelerometer for sudden impacts exceeding THRESHOLD (30 m/s²).
 * Debounced so it won't re-trigger within COOLDOWN_MS (30 seconds).
 * 
 * @returns {{ crashDetected: boolean, lastImpact: {x,y,z,magnitude,timestamp}|null, resetCrash: () => void, isSupported: boolean }}
 */

const THRESHOLD = 30; // m/s² — equivalent to a hard impact / sudden vehicle deceleration
const COOLDOWN_MS = 30000; // 30 seconds between crash triggers

export default function useCrashDetection() {
  const [crashDetected, setCrashDetected] = useState(false);
  const [lastImpact, setLastImpact] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const lastTriggerTime = useRef(0);

  const resetCrash = useCallback(() => {
    setCrashDetected(false);
  }, []);

  useEffect(() => {
    // Check if DeviceMotionEvent is available
    if (!("DeviceMotionEvent" in window)) {
      console.warn("[CrashDetection] DeviceMotion API not supported");
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null) return;

      const { x, y, z } = acc;
      // Calculate total acceleration magnitude
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      // Check if impact exceeds threshold and we're not in cooldown
      if (magnitude > THRESHOLD) {
        const now = Date.now();
        if (now - lastTriggerTime.current < COOLDOWN_MS) return;

        lastTriggerTime.current = now;
        console.log(`[CrashDetection] 🚨 Impact detected! Magnitude: ${magnitude.toFixed(1)} m/s²`);

        setLastImpact({
          x: x.toFixed(2),
          y: y.toFixed(2),
          z: z.toFixed(2),
          magnitude: magnitude.toFixed(1),
          timestamp: new Date().toISOString(),
        });
        setCrashDetected(true);
      }
    };

    // Some browsers (iOS 13+) require permission
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission()
        .then((state) => {
          if (state === "granted") {
            window.addEventListener("devicemotion", handleMotion);
          } else {
            console.warn("[CrashDetection] Permission denied");
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, []);

  return { crashDetected, lastImpact, resetCrash, isSupported };
}
