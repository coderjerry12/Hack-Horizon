import base64
import cv2
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llava:7b"

PROMPT = """You are a Critical Care AI Safety Monitoring Assistant.
Analyze this image of a person and respond ONLY in this format:
Intensity: <0-100>: <flag>: <explanation>

Flags: fallen, unresponsive, severe risk, potential danger, motionless, disoriented,
restricted movement, potential obstruction, labored breathing, seizure-like activity,
visible bleeding, hazard nearby, environmental risk, sudden collapse, no assistance

Pick only the most critical flag."""

def analyze(images):
    print(f"[LLAVA] Sending image to Ollama at {OLLAMA_URL} using model {OLLAMA_MODEL}...")
    # LLaVA handles one image best — use the last frame
    img = images[-1]
    _, buffer = cv2.imencode(".jpg", img)
    img_b64 = base64.b64encode(buffer).decode("utf-8")

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": PROMPT,
                "images": [img_b64],
                "stream": False
            },
            timeout=60
        )
        result = response.json().get("response", "Analysis error: no response")
        print(f"[LLAVA] Response received: {result[:80]}...")
        return result
    except Exception as e:
        print(f"[LLAVA] Error: {e}")
        return f"Analysis error: {str(e)}"
