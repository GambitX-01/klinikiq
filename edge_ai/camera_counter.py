import cv2
import requests
import time

# --- Configuration ---
BACKEND_URL = "http://localhost:8000/queue/update"
UPDATE_INTERVAL = 2  # Seconds between backend updates

# Initialize the HOG person detector
hog = cv2.HOGDescriptor()
hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

# Start video capture (0 is usually the laptop webcam)
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Could not open webcam.")
    exit()

print("KlinikIQ Edge AI: Camera Counter Active...")
last_update_time = time.time()

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Resize frame for faster processing
        frame = cv2.resize(frame, (640, 480))
        
        # Detect people
        # winStride and padding help balance speed vs accuracy
        boxes, weights = hog.detectMultiScale(frame, winStride=(8, 8), padding=(8, 8), scale=1.05)
        
        person_count = len(boxes)

        # Draw boxes around detected people for the demo GUI
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
                # Send count as a query parameter or body depending on backend choice
                requests.post(f"{BACKEND_URL}?count={person_count}")
                print(f"Backend Updated: {person_count} patients detected.")
            except Exception as e:
                print("Error updating backend. Is it running?")
            
            last_update_time = current_time

        # Press 'q' to exit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

except KeyboardInterrupt:
    print("Stopping...")

finally:
    cap.release()
    cv2.destroyAllWindows()
