import os
import cv2
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

SYSTEM_INSTRUCTIONS = """You are a Critical Care Safety Assistant. Analyze images and report what you observe about the person's condition and situation.

KEY INSTRUCTIONS:
1. Focus on the main points - how does the person look and what might they be experiencing?
2. Describe their appearance, posture, and visible state clearly and simply.
3. Based on what you see, predict what situation they might be in (e.g., resting, injured, in distress, in danger).
4. If there are signs of emergency or danger, include "EMERGENCY_DETECTED" in your response.

Format your response simply:
- How they look (appearance, posture, expression)
- What might be happening (your prediction of their situation, condition, or what they're going through)
- Any immediate concerns or dangers"""

def _encode_image(image):
    _, buffer = cv2.imencode(".jpg", image)
    return buffer.tobytes()

def analyze(images):
    print(f"[GEMINI] Sending {len(images)} image(s) for analysis...")
    prompt = """MAXIMUM 5 LINES ONLY. Be extremely brief:
1. How they look
2. What's happening
3. Emergency? (yes/no)
If emergency, include EMERGENCY_DETECTED."""
    
    contents = [prompt]
    for img in images:
        contents.append(types.Part.from_bytes(data=_encode_image(img), mime_type="image/jpeg"))

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTIONS,
                temperature=0.3,
                max_output_tokens=200,  # FORCE SHORT - max 200 tokens
            )
        )
        print(f"[GEMINI] Response received: {response.text[:100]}...")
        return response.text
    except Exception as e:
        print(f"[GEMINI] Error: {e}")
        return f"Analysis error: {str(e)}"
