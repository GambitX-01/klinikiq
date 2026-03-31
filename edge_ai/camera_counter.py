import cv2
import requests
import time
import sys

# --- Configuration ---
BACKEND_URL = "http://localhost:8000"
UPDATE_INTERVAL = 2  # Seconds between backend updates

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

# Start video capture (0 is usually the laptop webcam)
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Could not open webcam index 0. Try 1 or check permissions.")
    sys.exit(1)

check_backend()
print("KlinikIQ Edge AI: Camera Counter Active...")
last_update_time = time.time()

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame.")
            break

        # Resize frame for faster processing
        frame = cv2.resize(frame, (640, 480))
        
        # Detect people
        boxes, weights = hog.detectMultiScale(frame, winStride=(8, 8), padding=(8, 8), scale=1.05)
        
        person_count = len(boxes)

        # Draw boxes
        for (x, y, w, h) in boxes:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        cv2.putText(frame, f"KlinikIQ Detecting: {person_count}", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # Show the camera feed
        cv2.imshow('KlinikIQ - QueueSense [LAPTOP_CAM]', frame)

        # Update backend periodically
        current_time = time.time()
        if current_time - last_update_time >= UPDATE_INTERVAL:
            try:
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
