import json
import time
import numpy as np
import cv2
from flask import request, jsonify
from services.yolo_service import detect_person
from services.gemini_service import analyze as gemini_analyze
from services.llava_service import analyze as llava_analyze

# In-memory frame buffer and cooldown tracker
# Each request sends exactly 3 frames — buffer holds current batch only
frame_buffer = []
last_ai_call = 0
COOLDOWN = 60  # seconds between AI calls

EMERGENCY_KEYWORDS = [
    "emergency_detected", "emergency detected", "fallen", "unresponsive", "critical",
    "collapsed", "unconscious", "bleeding", "severe", "accident", "injured", "trauma",
    "danger", "immediate action", "urgent", "serious injury", "medical emergency"
]

def analyze_frames():
    global frame_buffer, last_ai_call

    # Always start fresh — frontend sends 3 frames per request
    frame_buffer = []

    print(f"\n[ANALYZE] POST /api/analyze hit")

    model_provider = request.form.get("model_provider", "gemini")
    print(f"[ANALYZE] Model provider: {model_provider}")

    # Collect frames from request
    frames_received = 0
    for i in range(3):
        file = request.files.get(f"image{i}")
        if file:
            image = np.frombuffer(file.read(), np.uint8)
            image = cv2.imdecode(image, cv2.IMREAD_COLOR)
            if image is not None:
                frame_buffer.append(image)
                frames_received += 1

    print(f"[ANALYZE] Frames received: {frames_received}/3")

    if frames_received == 0:
        return jsonify({"message": "No frames received", "emergency": False})

    # Run YOLO person detection on incoming frames only
    person_found = any(detect_person(img) for img in frame_buffer)

    if not person_found:
        frame_buffer.clear()
        print(f"[ANALYZE] No person detected — skipping AI")
        return jsonify({"message": "No person detected", "emergency": False})

    print(f"[ANALYZE] Person confirmed in {frames_received} frame(s)")

    # Cooldown check
    now = time.time()
    elapsed = now - last_ai_call
    if elapsed < COOLDOWN:
        remaining = int(COOLDOWN - elapsed)
        print(f"[ANALYZE] Cooldown active — {remaining}s remaining")
        frame_buffer.clear()
        return jsonify({"message": f"Monitoring... next analysis in {remaining}s", "emergency": False})

    # Dispatch to AI
    print(f"[ANALYZE] Dispatching to {model_provider.upper()}...")
    try:
        images = frame_buffer[:]
        frame_buffer.clear()
        last_ai_call = time.time()

        analysis = llava_analyze(images) if model_provider == "llava" else gemini_analyze(images)
        
        print(f"[ANALYZE] AI Response: {analysis}")

        # Check for emergency indicators — case insensitive
        analysis_lower = analysis.lower()
        is_emergency = any(kw in analysis_lower for kw in EMERGENCY_KEYWORDS)
        
        # If not explicitly emergency, check for multiple danger indicators
        if not is_emergency:
            danger_indicators = ["appear", "risk", "danger", "abnormal", "unusual position", "need", "help", "assist"]
            danger_count = sum(1 for indicator in danger_indicators if indicator in analysis_lower)
            # If multiple danger indicators are found, flag as potential emergency
            if danger_count >= 3:
                is_emergency = True
                print(f"[ANALYZE] Potential emergency detected (found {danger_count} danger indicators)")
        
        print(f"[ANALYZE] Result — Emergency: {is_emergency} | {analysis[:100]}...")

        return jsonify({"message": analysis, "emergency": is_emergency})

    except Exception as e:
        print(f"[ANALYZE] Error during analysis: {e}")
        frame_buffer.clear()
        return jsonify({"message": "Analysis failed", "emergency": False})

