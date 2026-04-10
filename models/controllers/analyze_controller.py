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
    "emergency_detected", "emergency detected", "fallen", "unresponsive", "critical"
]

def analyze_frames():
    global frame_buffer, last_ai_call

    # Always start fresh — frontend sends 3 frames per request
    frame_buffer = []
    last_ai_call = 0 # reset to bypass cooldown for testing

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

        is_emergency = any(kw in analysis.lower() for kw in EMERGENCY_KEYWORDS)
        print(f"[ANALYZE] Result — Emergency: {is_emergency} | {analysis[:80]}...")

        # Note: Email alerts are handled by the Node.js backend (Mailtrap)
        # This endpoint only returns the AI analysis result

        return jsonify({"message": analysis, "emergency": is_emergency})

    except Exception as e:
        print(f"[ANALYZE] Error during analysis: {e}")
        frame_buffer.clear()
        return jsonify({"message": "Analysis failed", "emergency": False})

