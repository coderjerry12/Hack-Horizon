import os
import cv2
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

SYSTEM_INSTRUCTIONS = """
You are a Critical Care AI Safety Monitoring Assistant. 
Analyze the images provided of an individual and their environment.
Provide a detailed, professional emergency and safety analysis report.
If there is an emergency (e.g., fallen, unresponsive, bleeding, struggling), you must include the EXACT word "EMERGENCY_DETECTED" in your response.

Please structure your report clearly with:
- Visual Observations
- Risk & Safety Assessment
- Recommended Immediate Actions
"""

def _encode_image(image):
    _, buffer = cv2.imencode(".jpg", image)
    return buffer.tobytes()

def analyze(images):
    print(f"[GEMINI] Sending {len(images)} image(s) for analysis...")
    prompt = "Perform a comprehensive safety and medical observation of these sequential images. Output a proper full analysis report detailing the subject's posture, environment hazards, and any signs of distress. If they are in danger, ensure you say EMERGENCY_DETECTED."
    contents = [prompt]
    for img in images:
        contents.append(types.Part.from_bytes(data=_encode_image(img), mime_type="image/jpeg"))

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTIONS,
                temperature=0.4,
                max_output_tokens=1200,
            )
        )
        print(f"[GEMINI] Response received: {response.text[:80]}...")
        return response.text
    except Exception as e:
        print(f"[GEMINI] Error: {e}")
        return f"Analysis error: {str(e)}"
