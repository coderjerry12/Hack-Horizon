# Critical Care AI Safety Monitor 🚨

A real-time safety monitoring system that uses YOLO object detection combined with Gemini 2.5-Flash (or Ollama LLaVA) AI to detect and alert on emergency situations.

## Project Structure

```
Hack-Horizon/
├── backend/
│   ├── flask_server.py          # Main Flask API with YOLO + Gemini integration
│   └── requirements.txt          # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Real-time monitoring with camera
│   │   │   ├── Config.jsx        # User settings and emergency info
│   │   │   └── Results.jsx       # Analysis results and alerts
│   │   ├── styles/
│   │   │   ├── Dashboard.css
│   │   │   ├── Config.css
│   │   │   └── Results.css
│   │   ├── App.jsx               # Main app component
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── models/
    └── yolo11n.pt               # YOLO 11 Nano model
```

## Features

✅ **Real-time Video Monitoring** - Continuous camera feed analysis  
✅ **YOLO Detection** - Person detection in frame  
✅ **AI Analysis** - Gemini 2.5-Flash or Ollama LLaVA assessment  
✅ **Emergency Alerts** - Email notifications with location data  
✅ **Risk Level Assessment** - 0-100% risk scoring  
✅ **Location Tracking** - GPS coordinates for emergency response  
✅ **User Configuration** - Personalized settings and contact info  

## Tech Stack

### Backend
- **Framework**: Flask
- **Detection**: YOLO 11 Nano (ultralytics)
- **AI Providers**: 
  - Google Gemini 2.5-Flash API
  - Ollama LLaVA (local alternative)
- **Email**: SMTP with Gmail
- **Image Processing**: OpenCV, NumPy

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Custom CSS with responsive design
- **APIs**: Fetch API for Flask communication
- **Features**: Camera access, geolocation, local storage

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- Ollama (optional, for local LLaVA)
- Google Gemini API key (from [Google AI Studio](https://aistudio.google.com))

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/Scripts/activate  # Windows
source venv/bin/activate      # macOS/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables (create `.env`):
```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_TO=default_alert_recipient@example.com
```

5. Download YOLO model:
```bash
python -c "from ultralytics import YOLO; YOLO('yolo11n.pt')"
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Start Backend (Flask)
```bash
cd backend
python flask_server.py
```
Server runs on `http://localhost:5003`

### Start Frontend (Vite)
```bash
cd frontend
npm run dev
```
App runs on `http://localhost:3000`

## Usage

1. **Open App**: Visit `http://localhost:3000`
2. **Configure Settings**: Go to Settings tab
   - Enter name and contact info
   - Set emergency email address
   - Get current location (optional)
3. **Start Monitoring**: Click "Start Monitoring" in Dashboard
4. **Automatic Analysis**: System captures 3 frames (every 500ms) and analyzes
5. **View Results**: Emergency alerts display in Results tab

## API Endpoints

### POST `/projects/api3/analyze`
Analyze images for safety conditions

**Request:**
```
Content-Type: multipart/form-data
image0: <binary>
image1: <binary>
image2: <binary>
email_config: {"name": "...", "phone": "...", ...}
model_provider: "gemini" | "llava"
```

**Response:**
```json
{
  "message": "Intensity: 0: safe: No anomalies detected",
  "emergency": false
}
```

## Safety Flags

The system can detect these emergency conditions:
- 🚨 **Fallen** - Person on ground
- 🚨 **Unresponsive** - Not moving or responsive
- 🚨 **Severe Risk** - Critical danger detected
- ⚠️ **Potential Danger** - Suspicious activity
- ⚠️ **Disoriented** - Confusion/loss of balance
- ⚠️ **Restricted Movement** - Limited mobility
- ⚠️ **Labored Breathing** - Difficulty breathing
- 🚨 **Seizure-like Activity** - Convulsions detected
- 🚨 **Visible Bleeding** - Blood present
- ⚠️ **Hazard Nearby** - Environmental danger

## Configuration

### Supported Models
- **Gemini 2.5-Flash**: Cloud-based, more accurate, requires API key
- **Ollama LLaVA**: Local processing, privacy-focused, requires Ollama

### Email Setup (Gmail)
1. Enable 2-factor authentication
2. Generate [App Password](https://myaccount.google.com/apppasswords)
3. Use app password in `EMAIL_PASS`

## Performance Tips

- Use camera resolution around 640x480 for optimal YOLO performance
- 3-frame buffer with 500ms interval = ~1.5s analysis cycle
- Gemini has 60s cooldown between analyses (prevents API spam)
- Local LLaVA may take 10-30s per analysis

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No camera access | Allow camera permissions in browser |
| API errors | Check `.env` file and API keys |
| Slow analysis | Use GPU-enabled Ollama, or reduce image resolution |
| Email not sending | Verify Gmail app password and SMTP settings |
| YOLO model not found | Download with: `python -c "from ultralytics import YOLO; YOLO('yolo11n.pt')"` |

## Security Considerations

⚠️ **Important**: This system handles sensitive data
- Store `.env` files securely (never commit to git)
- Use environment variables for all secrets
- HTTPS recommended for production
- Email credentials should use app-specific passwords
- Location data should be encrypted in transit

## Future Enhancements

- [ ] Multi-person tracking
- [ ] Pose-based activity recognition
- [ ] SMS alerts fallback
- [ ] Database persistence for audit logs
- [ ] Real-time streaming to emergency services
- [ ] Mobile app version
- [ ] Voice alerts
- [ ] Integrations with emergency dispatch systems

## License

MIT License - See LICENSE file for details

## Support

For issues or feature requests, please create an issue in the repository.

---

**⚠️ Emergency Response System** | YOLO + Gemini/Ollama Integration | v1.0
