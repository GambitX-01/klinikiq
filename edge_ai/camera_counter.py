import cv2
import requests
import time
import sys
import os

# --- Configuration ---
# Use 'export BACKEND_URL=https://your-api.com' to point to the cloud
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
# Use 'export CAMERA_ID=1' for external webcam, 0 for internal
CAMERA_ID = int(os.getenv("CAMERA_ID", "0"))
UPDATE_INTERVAL = 2 

def check_backend():
    print(f"Checking KlinikIQ Backend at {BACKEND_URL}...")
    try:
        response = requests.get(BACKEND_URL, timeout=2)
        if response.status_code == 200:
            print("Backend connected successfully.")
            return True
    except Exception:
        pass
    print("WARNING: Could not reach KlinikIQ Backend. Is it running?")
    return False

# Initialize the HOG person detector
hog = cv2.HOGDescriptor()
hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

# Start video capture
print(f"Initializing camera at index {CAMERA_ID}...")
cap = cv2.VideoCapture(CAMERA_ID)

if not cap.isOpened():
    print(f"Error: Could not open webcam at index {CAMERA_ID}.")
    if CAMERA_ID == 0:
        print("Tip: If you have an external webcam, try running: export CAMERA_ID=1")
    sys.exit(1)

check_backend()
print(f"KlinikIQ Edge Node [GQEBERHA]: Active using camera index {CAMERA_ID}...")
last_update_time = time.time()

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame from camera.")
            break

        # Resize for faster processing
        frame = cv2.resize(frame, (640, 480))
        
        # Detect people
        boxes, _ = hog.detectMultiScale(frame, winStride=(8, 8), padding=(8, 8), scale=1.05)
        person_count = len(boxes)

        # Draw boxes
        for (x, y, w, h) in boxes:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        cv2.putText(frame, f"KlinikIQ Edge: {person_count} Patients", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # Show the camera feed
        cv2.imshow('KlinikIQ - Edge Node Monitoring', frame)

        # Update backend periodically
        current_time = time.time()
        if current_time - last_update_time >= UPDATE_INTERVAL:
            try:
                # Send count as query parameter
                requests.post(f"{BACKEND_URL}/queue/update?count={person_count}", timeout=1)
                print(f"[{time.strftime('%H:%M:%S')}] Sync: {person_count} patients detected.")
            except Exception:
                print("Sync failed: Backend unreachable.")
            
            last_update_time = current_time

        # Press 'q' to exit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

except KeyboardInterrupt:
    print("Stopping...")

finally:
    cap.release()
    cv2.destroyAllWindows()
