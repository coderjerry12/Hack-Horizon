# RakshaSetu - Community Emergency Response Platform

RakshaSetu is an intelligent emergency coordination network designed for neighborhoods and campuses. It enables instant SOS alerts, AI-powered accident detection, smart routing to hospitals, and real-time coordination between responders, guardians, and emergency services.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [AI Models Used](#ai-models-used)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Functionality
- **One-Tap SOS**: Instantly alert nearby responders, guardians, and emergency services with a single tap
- **AI Accident Detection**: Automatic emergency detection using YOLO11n + Gemini 2.5 Flash / LLaVA 7b vision models
- **Smart Routing**: Real-time traffic-aware routing to nearest hospitals using TomTom Navigation API
- **Hospital Finder**: Locate nearby hospitals with live ETA, contact info, and turn-by-turn directions
- **Guardian Mode**: Assign trusted contacts who get notified first before the wider community
- **Community Responders**: Skilled volunteers (CPR, first aid, fire safety) dispatched intelligently based on proximity
- **Real-time Chat**: WebSocket-based live communication between responders and SOS broadcasters
- **Emergency QR Card**: Generate QR codes with medical history for first responders
- **Offline Support**: Queue SOS alerts when offline and sync when connection is restored
- **Admin Dashboard**: Comprehensive analytics, user management, and resource allocation

### AI Safety Monitor
- **Person Detection**: YOLOv11n detects if a person is present in the frame
- **Crisis Classification**: Identifies crisis type (medical, fire, crime, accident, natural disaster)
- **Status Assessment**: Determines emergency status (fallen, unresponsive, severe risk, etc.)
- **Multi-frame Analysis**: Captures 3 frames for accurate assessment
- **Auto-SOS Trigger**: Automatically creates SOS alerts for high-severity emergencies
- **Email Routing**: Crisis-specific email alerts to appropriate emergency services

## Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS 4** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **Zustand** - State management
- **Leaflet** - Interactive maps
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **QRCode.react** - QR code generation
- **Phosphor Icons** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **Cloudinary** - Image storage
- **Multer** - File upload handling

### AI/ML Services (Python)
- **Flask** - Lightweight web framework
- **YOLOv11n** - Object detection (person detection)
- **Gemini 2.5 Flash** - Google's vision language model
- **LLaVA 7b** - Open-source vision language model (via Ollama)
- **OpenCV** - Image processing
- **Ultralytics** - YOLO implementation

### External APIs
- **TomTom Maps API** - Routing and navigation
- **Google Gemini API** - AI vision analysis
- **Cloudinary API** - Image hosting

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │ ◄─────► │   Backend    │ ◄─────► │   MongoDB   │
│  (React)    │         │  (Node.js)   │         │  Database   │
└─────────────┘         └──────────────┘         └─────────────┘
       │                        │
       │                        │
       ▼                        ▼
┌─────────────┐         ┌──────────────┐
│  AI Service │         │  Socket.io   │
│  (Flask)    │         │  WebSocket   │
└─────────────┘         └──────────────┘
       │
       ▼
┌─────────────────────────────┐
│  YOLO11n → Gemini/LLaVA    │
│  Person Detection → Crisis  │
│  Classification             │
└─────────────────────────────┘
```

## Folder Structure

```
RakshaSetu/
│
├── frontend/                    # React frontend application
│   ├── public/                  # Static assets
│   │   ├── logo.png            # Application logo
│   │   ├── favicon.svg         # Favicon
│   │   └── icons.svg           # Icon sprites
│   ├── src/
│   │   ├── assets/             # Images and media
│   │   ├── components/         # Reusable React components
│   │   │   ├── AICrisisChat.jsx
│   │   │   ├── AppNavbar.jsx
│   │   │   ├── CrisisSelector.jsx
│   │   │   ├── HospitalFinder.jsx
│   │   │   ├── MapGestureGuard.jsx
│   │   │   ├── PageLoader.jsx
│   │   │   ├── RatingModal.jsx
│   │   │   ├── ResourceMap.jsx
│   │   │   ├── ScreenPopup.jsx
│   │   │   └── SOSAlertModal.jsx
│   │   ├── pages/              # Page components
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Config.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EmergencyCard.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MyEmergencyQR.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Results.jsx
│   │   │   ├── SafetyMonitor.jsx
│   │   │   ├── SetupAccount.jsx
│   │   │   └── SOSBroadcast.jsx
│   │   ├── services/           # API and service integrations
│   │   │   ├── api.js          # Axios API client
│   │   │   ├── offlineSOSQueue.js
│   │   │   └── socket.js       # Socket.io client
│   │   ├── store/              # State management
│   │   │   └── authStore.js    # Zustand auth store
│   │   ├── App.jsx             # Root component
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── .env.example            # Environment variables template
│   ├── package.json            # Dependencies
│   ├── vite.config.js          # Vite configuration
│   └── vercel.json             # Vercel deployment config
│
├── backend/                     # Node.js backend server
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   │   ├── admin.controller.js
│   │   │   ├── ambulance.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── chatbot.controller.js
│   │   │   ├── hospital.controllers.js
│   │   │   ├── public.controller.js
│   │   │   ├── resource.controller.js
│   │   │   ├── routing.controller.js
│   │   │   └── sos.controller.js
│   │   ├── db/                 # Database connection
│   │   │   └── index.js
│   │   ├── middlewares/        # Express middlewares
│   │   │   ├── auth.middleware.js
│   │   │   ├── multer.middleware.js
│   │   │   └── validator.middleware.js
│   │   ├── models/             # Mongoose schemas
│   │   │   ├── ambulance.model.js
│   │   │   ├── hospital.model.js
│   │   │   ├── resource.model.js
│   │   │   ├── sos.model.js
│   │   │   └── user.model.js
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   │   ├── ambulanceDispatch.service.js
│   │   │   ├── dispatchService.js
│   │   │   ├── emailAlertService.js
│   │   │   ├── hospital.service.js
│   │   │   ├── locationService.js
│   │   │   └── routingService.js
│   │   ├── socket/             # WebSocket handlers
│   │   │   └── index.js
│   │   ├── utils/              # Utility functions
│   │   │   ├── aiService.js
│   │   │   ├── ApiError.js
│   │   │   ├── ApiResponse.js
│   │   │   ├── asyncHandler.js
│   │   │   ├── cloudinary.js
│   │   │   └── mail.js
│   │   ├── validators/         # Input validation
│   │   │   └── index.js
│   │   ├── app.js              # Express app setup
│   │   ├── constant.js         # Constants
│   │   └── index.js            # Server entry point
│   ├── .env.example            # Environment variables template
│   └── package.json            # Dependencies
│
├── models/                      # Python AI/ML service
│   ├── controllers/            # Flask route handlers
│   │   ├── analyze_controller.py
│   │   ├── health_controller.py
│   │   └── __init__.py
│   ├── models/                 # Pre-trained models
│   │   └── yolo11n.pt         # YOLOv11 nano model
│   ├── routes/                 # API routes
│   ├── services/               # AI service logic
│   │   ├── email_service.py   # Emergency email alerts
│   │   ├── gemini_service.py  # Gemini vision API
│   │   ├── llava_service.py   # LLaVA via Ollama
│   │   ├── yolo_service.py    # YOLO person detection
│   │   └── __init__.py
│   ├── app.py                  # Flask app setup
│   ├── run_server.py           # Server entry point
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Environment variables template
│
└── README.md                    # Project documentation
```

## AI Models Used

### 1. YOLOv11n (Ultralytics)
- **Purpose**: Real-time person detection in video frames
- **Model**: `yolo11n.pt` (nano variant for speed)
- **Framework**: Ultralytics YOLO
- **Input**: Image frames from camera or uploaded photos
- **Output**: Bounding boxes and confidence scores for detected persons
- **Performance**: ~50ms inference time on CPU

### 2. Gemini 2.5 Flash (Google)
- **Purpose**: Vision-language model for emergency analysis
- **Provider**: Google Generative AI
- **Input**: 3 image frames + structured prompt
- **Output**: JSON with crisis classification
  ```json
  {
    "emergency": true,
    "crisis_type": "medical",
    "intensity": 85,
    "flag": "unresponsive",
    "summary": "Person lying on ground with visible bleeding"
  }
  ```
- **Features**: Fast inference, high accuracy, structured output

### 3. LLaVA 7b (via Ollama)
- **Purpose**: Open-source alternative to Gemini
- **Provider**: Ollama (local inference)
- **Model**: `llava:7b`
- **Input**: Single image frame + structured prompt
- **Output**: Same JSON structure as Gemini
- **Advantage**: Runs locally, no API costs, privacy-focused

### AI Pipeline Flow

```
Camera/Upload
     │
     ▼
Capture 3 Frames
     │
     ▼
YOLO Person Detection ──► No Person? ──► Return "No person detected"
     │
     ▼ Person Found
Gemini/LLaVA Analysis
     │
     ▼
Crisis Classification
     │
     ├─► Crisis Type (medical, fire, crime, etc.)
     ├─► Status (fallen, unresponsive, etc.)
     └─► Emergency Flag (true/false)
     │
     ▼
Auto-SOS Trigger (if severity high)
     │
     ▼
Email Alert to Emergency Services
```

## Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- MongoDB 6+
- Ollama (optional, for LLaVA model)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/RakshaSetu.git
cd RakshaSetu
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 4. AI Service Setup
```bash
cd models
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python run_server.py
```

### 5. Install Ollama (Optional - for LLaVA)
```bash
# Install Ollama from https://ollama.ai
ollama pull llava:7b
```

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_PYTHON_API_URL=http://localhost:5003
VITE_SOCKET_URL=http://localhost:5000
VITE_TOMTOM_API_KEY=your_tomtom_api_key
```

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/raksha-setu
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
```

### AI Service (.env)
```env
GEMINI_API_KEY=your_gemini_api_key
EMAIL_DEFAULT=emergency@example.com
EMAIL_MEDICAL=medical@example.com
EMAIL_FIRE=fire@example.com
EMAIL_CRIME=police@example.com
EMAIL_DISASTER=disaster@example.com
BACKEND_API_URL=http://localhost:5000
```

## Usage

### Starting the Application

1. **Start MongoDB**
```bash
mongod
```

2. **Start Backend Server**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

3. **Start AI Service**
```bash
cd models
python run_server.py
# Service runs on http://localhost:5003
```

4. **Start Frontend**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### User Roles

- **Regular User**: Create SOS alerts, view nearby emergencies, respond to alerts
- **Admin**: Manage users, view analytics, seed ambulances/hospitals, suspend accounts

### Example Workflow

1. **Register/Login**: Create an account or sign in
2. **Setup Profile**: Add medical history (blood type, allergies, medications)
3. **Create SOS**: 
   - Tap the SOS button on dashboard
   - Select crisis type and broadcast radius
   - Location is automatically captured
4. **AI Safety Monitor**:
   - Navigate to Safety Monitor
   - Choose Gemini or Ollama model
   - Capture live camera frames or upload image
   - AI analyzes and auto-triggers SOS if emergency detected
5. **Respond to SOS**:
   - View active SOS alerts on map
   - Accept alert to respond
   - Use real-time chat to coordinate
   - Get turn-by-turn navigation to location
6. **Emergency QR**:
   - Generate QR code with medical info
   - First responders scan for instant access to medical history

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token

### SOS
- `POST /api/sos` - Create SOS alert
- `GET /api/sos/active` - Get active SOS alerts
- `GET /api/sos/:id` - Get SOS details
- `PATCH /api/sos/:id/accept` - Accept SOS alert
- `PATCH /api/sos/:id/resolve` - Resolve SOS alert

### AI Analysis
- `POST /api/analyze` - Analyze images for emergency detection

### Hospitals
- `GET /api/hospitals/nearby` - Find nearby hospitals
- `GET /api/routing/route` - Get route to hospital

### Admin
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/suspend` - Suspend/unsuspend user
- `POST /api/admin/seed-ambulances` - Seed ambulance data

## Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### AI Safety Monitor
![Safety Monitor](screenshots/safety-monitor.png)

### SOS Broadcast
![SOS Broadcast](screenshots/sos-broadcast.png)

### Hospital Finder
![Hospital Finder](screenshots/hospital-finder.png)

### Admin Dashboard
![Admin Dashboard](screenshots/admin-dashboard.png)

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

---

Built with ❤️ by Team Veriton