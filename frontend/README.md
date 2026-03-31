KlinikIQ

An autonomous clinic intelligence layer that monitors medicine dispensing velocity and patient volume in real time, predicts stockouts 48 hours in advance, and triggers restocking without human intervention — turning passive clinic data into life-saving action.
The Problem

South Africa's public clinics dispense medicine and manage queues manually, with no system that predicts or prevents stockouts before they devastate patient care. Existing systems like DHIS2 collect data but never act on it — KlinikIQ is the intelligence layer that closes that gap.
Three Modules
MediTrack

Arduino + RFID tracks every medicine dispensed. Edge AI predicts stockout 48hrs ahead. Auto-alerts district pharmacy.
QueueSense

Raspberry Pi + Camera counts patients via Edge AI. Works fully offline. Patients check wait times via WhatsApp.
KlinikDash

React dashboard + Three.js 3D clinic map. Live stock and queue data. Agentic AI fires restocking autonomously.
System Architecture — 5 Layers
Layer 1
Hardware / Sensing
Raspberry Pi 4 + Camera Module · Arduino Uno + RFID RC522 · DHT22 Temperature/Humidity Sensor
Layer 2
Edge AI (offline capable)
TFLite MobileNetV3 people counter · OpenCV preprocessing · Mosquitto MQTT broker · runs on Raspberry Pi, no internet required
Layer 3
Communication
MQTT port 8883 (TLS) · Mosquitto → AWS IoT Core · REST API for event-based alerts · WebSocket for live dashboard sync
Layer 4
Cloud & AI
FastAPI backend · Firebase Firestore (real-time) · scikit-learn demand forecasting · Agentic AI restocking agent · PostgreSQL historical store
Layer 5
Application & 3D Visualisation
React.js KlinikDash · Three.js 3D clinic floor plan (live zone colouring) · WhatsApp Bot via Twilio · District manager map view
AI Implementation
Medicine depletion predictor
Predictive ML

XGBoost time-series model. Calculates dispensing velocity. Predicts stockout 48hrs ahead. Runs on Raspberry Pi via TFLite.
Patient counter
Computer Vision

MobileNetV3 CNN. Counts entries and exits at 15fps. 8-bit quantised, under 8MB. Fully offline on Raspberry Pi.
Demand forecasting
Supervised Learning

Random Forest on cloud. Validates edge predictions. Generates 7-day medicine demand forecast per clinic.
⭐ Restocking agent
Agentic AI

LangChain agent loop. Detects threshold breach → calculates quantity → generates order → sends WhatsApp alert. Zero human input.
Tech Stack
Layer	Technology
Edge AI	TensorFlow Lite MobileNetV3 OpenCV
Microcontroller	Arduino Uno RFID RC522 DHT22
Edge device	Raspberry Pi 4 Mosquitto MQTT
Communication	MQTT (TLS) AWS IoT Core WebSocket
Backend	FastAPI Python scikit-learn LangChain
Database	Firebase Firestore PostgreSQL
Frontend	React.js Three.js Recharts
Messaging	Twilio WhatsApp API
Cloud	AWS IoT Core Google Cloud Platform
Setup & Installation
Prerequisites

Python 3.10+
Node.js 18+
Arduino IDE 2.x
Raspberry Pi OS (64-bit)
Firebase account
AWS account

1. Clone the repository

git clone https://github.com/GambitX/klinikiq.git
cd klinikiq

2. Hardware setup

# Raspberry Pi — install dependencies
pip install opencv-python tflite-runtime paho-mqtt firebase-admin

# Arduino — flash MediTrack firmware
# Open arduino/meditrack/meditrack.ino in Arduino IDE
# Install MFRC522 library via Library Manager
# Upload to Arduino Uno

3. Edge AI setup (Raspberry Pi)

cd edge/
pip install -r requirements.txt

# Download quantised TFLite model
wget https://your-bucket/mobilenet_queue_v1.tflite -O models/queue_model.tflite

# Start edge inference + MQTT publisher
python main.py --broker localhost --topic klinikiq/queue

4. Backend setup

cd backend/
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env: AWS_IOT_ENDPOINT, FIREBASE_KEY, TWILIO_SID, TWILIO_TOKEN

# Start FastAPI server
uvicorn main:app --reload --port 8000

5. Frontend setup

cd frontend/
npm install
npm run dev

Demo Flow

The live demo sequence — rehearse until perfect:

    Scan RFID medicine card → MediTrack logs dispensing event
    Edge AI calculates depletion velocity on Raspberry Pi (offline)
    MQTT pushes prediction to AWS IoT Core → Firebase updates
    React dashboard live count drops · Three.js pharmacy zone turns amber → red
    Threshold breached → Agentic AI fires WhatsApp restocking order automatically
    Manager dashboard logs autonomous action with timestamp and quantity

Repository Structure

klinikiq/
├── arduino/
│   └── meditrack/          # RFID medicine tracking firmware
├── edge/
│   ├── models/             # TFLite quantised models
│   ├── queue_counter.py    # OpenCV + TFLite people counter
│   └── mqtt_publisher.py   # Mosquitto MQTT client
├── backend/
│   ├── main.py             # FastAPI application
│   ├── models/             # scikit-learn demand forecasting
│   ├── agent/              # LangChain agentic AI restocking
│   └── routes/             # API endpoints
├── frontend/
│   ├── src/
│   │   ├── components/     # React dashboard components
│   │   └── three/          # Three.js 3D clinic map
│   └── package.json
├── docs/
│   ├── architecture.png    # System architecture diagram
│   └── wiring.png          # Hardware wiring diagram
├── .env.example
├── .gitignore              # Excludes all API keys and credentials
└── README.md

Environment Variables



Compliance & Ethics

    No facial data stored — anonymous patient counts only (POPIA compliant)
    All MQTT channels encrypted via TLS port 8883
    No personal health information collected or transmitted
    Edge AI runs locally — sensitive clinic data never leaves the device unnecessarily
    Agentic AI actions logged with full audit trail for human review

Business Model
Revenue stream	Price	Customer
Hardware kit (once-off)	R3,500 / clinic	Department of Health
SaaS subscription	R800 / month / clinic	District health offices
District license	R15,000 / month	Provincial health depts
Analytics reports	R5,000 / report	National DoH, researchers

3,837 public clinics × R800/month = R3.07M/month at national scale.