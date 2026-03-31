import cv2
import requests
import time
import sys
import signal
import os

# --- Configuration ---
# You can set this via environment variable: export BACKEND_URL=https://your-api.com
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000") 
UPDATE_INTERVAL = 2  # Seconds between backend updates
CAMERA_ID = 0        # 0 for CSI Camera, or USB camera index

def gstreamer_pipeline(
    sensor_id=0,
    capture_width=1280,
    capture_height=720,
    display_width=640,
    display_height=480,
    framerate=30,
    flip_method=0,
):
    """GStreamer pipeline for Raspberry Pi Camera (CSI) on Jetson Nano"""
    return (
        "nvarguscamerasrc sensor-id=%d ! "
        "video/x-raw(memory:NVMM), width=(int)%d, height=(int)%d, format=(string)NV12, framerate=(fraction)%d/1 ! "
        "nvvidconv flip-method=%d ! "
        "video/x-raw, width=(int)%d, height=(int)%d, format=(string)BGRx ! "
        "videoconvert ! "
        "video/x-raw, format=(string)BGR ! appsink"
        % (
            sensor_id,
            capture_width,
            capture_height,
            framerate,
            flip_method,
            display_width,
            display_height,
        )
    )

def signal_handler(sig, frame):
    print('\nTerminating KlinikIQ Jetson Edge...')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def run_edge():
    print("--- KlinikIQ Jetson Nano Edge Node ---")
    
    # Initialize CSI Camera via GStreamer
    print("Initializing CSI Camera...")
    cap = cv2.VideoCapture(gstreamer_pipeline(sensor_id=CAMERA_ID), cv2.CAP_GSTREAMER)

    if not cap.isOpened():
        print("CSI Camera failed. Attempting fallback to USB webcam...")
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("CRITICAL: No camera detected. Check connections.")
            return

    # Initialize HOG Detector (For Jetson, consider TensorRT/SSD-Mobilenet for better FPS)
    hog = cv2.HOGDescriptor()
    hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

    last_update = time.time()
    print("KlinikIQ Jetson Nano: Active and Monitoring...")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to capture frame.")
                break

            # Person Detection
            # On Jetson Nano, HOG can be slow. We resize for performance.
            boxes, _ = hog.detectMultiScale(frame, winStride=(8, 8), padding=(8, 8), scale=1.05)
            person_count = len(boxes)

            # Local visualization (Disable for production to save resources)
            cv2.putText(frame, f"KlinikIQ Node: {person_count} Patients", (15, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.imshow("KlinikIQ Jetson Feed", frame)

            # Sync with Central Backend
            current_time = time.time()
            if current_time - last_update >= UPDATE_INTERVAL:
                try:
                    # Explicitly use query parameter for compatibility
                    url = f"{BACKEND_URL}/queue/update?count={person_count}"
                    requests.post(url, timeout=1)
                    print(f"[{time.strftime('%H:%M:%S')}] Sync Successful: {person_count} Patients")
                except Exception:
                    print(f"[{time.strftime('%H:%M:%S')}] Sync Failed: Backend unreachable at {BACKEND_URL}")
                
                last_update = current_time

            # 'q' to quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    finally:
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    run_edge()
