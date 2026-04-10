import base64
import cv2
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llava:latest"

PROMPT = """You are a Critical Care AI Safety Monitoring Assistant.
Perform a comprehensive safety and medical observation of this image. Output a proper full analysis report detailing the subject's posture, environment hazards, and any signs of distress. 
Structure your report clearly with:
- Visual Observations
- Risk & Safety Assessment
- Recommended Immediate Actions

If they are in danger or it's an emergency, ensure you include the EXACT word "EMERGENCY_DETECTED" in your response."""

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
            timeout=120
        )
        
        data = response.json()
        
        if "error" in data:
            err_msg = data["error"]
            print(f"[LLAVA] Ollama returned error: {err_msg}")
            return f"Analysis error: {err_msg}"
            
        result = data.get("response", "Analysis error: no response")
        print(f"[LLAVA] Response received: {result[:80]}...")
        return result
    except Exception as e:
        print(f"[LLAVA] Error: {e}")
        return f"Analysis error: {str(e)}"
