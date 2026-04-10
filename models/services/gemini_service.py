import os
import cv2
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

SYSTEM_INSTRUCTIONS = """
You are a Critical Care AI Safety Monitoring Assistant designed to assess and report on an individual's condition in real-time.

Flags and Definitions:
The system must raise only one flag per assessment. Use the following format:
Intensity: <intensity>: <flag>: <explanation>

Flag Definitions:
- fallen, unresponsive, severe risk, potential danger, motionless, disoriented,
  restricted movement, potential obstruction, labored breathing, seizure-like activity,
  visible bleeding, hazard nearby, environmental risk, sudden collapse, no assistance

Reporting Guidelines:
- Output strictly in the format: Intensity: <intensity>: <flag>: <explanation>.
- Report only one flag per assessment, focusing on the most critical observation.
"""

def _encode_image(image):
    _, buffer = cv2.imencode(".jpg", image)
    return buffer.tobytes()

def analyze(images):
    print(f"[GEMINI] Sending {len(images)} image(s) for analysis...")
    prompt = "Analyze these sequential images of a person. Provide a brief, concise assessment focusing on safety and potential emergencies."
    contents = [prompt]
    for img in images:
        contents.append(types.Part.from_bytes(data=_encode_image(img), mime_type="image/jpeg"))

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTIONS,
                temperature=0.2,
                max_output_tokens=512,
            )
        )
        print(f"[GEMINI] Response received: {response.text[:80]}...")
        return response.text
    except Exception as e:
        print(f"[GEMINI] Error: {e}")
        return f"Analysis error: {str(e)}"
