import base64
import cv2
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llava:7b"

PROMPT = """ANSWER IN EXACTLY 2-3 SENTENCES ONLY:
1. How they look (appearance/posture)
2. What's happening (situation)
3. EMERGENCY? (yes/no with EMERGENCY_DETECTED if critical)
STOP HERE. DO NOT WRITE MORE."""

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
                "stream": False,
                "num_predict": 150  # FORCE SHORT OUTPUT - max 150 tokens
            },
            timeout=120
        )
        
        data = response.json()
        
        if "error" in data:
            err_msg = data["error"]
            print(f"[LLAVA] Ollama returned error: {err_msg}")
            return f"Analysis error: {err_msg}"
            
        result = data.get("response", "Analysis error: no response")
        print(f"[LLAVA] Response received: {result[:100]}...")
        return result
    except Exception as e:
        print(f"[LLAVA] Error: {e}")
        return f"Analysis error: {str(e)}"
