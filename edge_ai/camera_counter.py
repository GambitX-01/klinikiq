import cv2
import requests
import time
import sys
import os
import threading

from head_tracker import HeadTracker

# --- Configuration ---
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
UPDATE_INTERVAL = 2
DETECT_EVERY_N_FRAMES = 1    # Kalman prediction covers every frame; detection runs each one
DETECT_RESIZE = (640, 480)   # full display resolution — MediaPipe handles this fine


class CameraStream:
    """Continuously grabs frames in a background thread so the main loop always gets the latest."""
    def __init__(self, src=1):
        self.cap = cv2.VideoCapture(src)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.ret, self.frame = self.cap.read()
        self._lock = threading.Lock()
        self._stop = False
        threading.Thread(target=self._grab_loop, daemon=True).start()

    def _grab_loop(self):
        while not self._stop:
            ret, frame = self.cap.read()
            with self._lock:
                self.ret, self.frame = ret, frame

    def read(self):
        with self._lock:
            return self.ret, self.frame.copy() if self.ret else (False, None)

    def isOpened(self):
        return self.cap.isOpened()

    def release(self):
        self._stop = True
        self.cap.release()


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

def send_update(url, count):
    try:
        requests.post(url, timeout=1)
        print(f"[{time.strftime('%H:%M:%S')}] Sync: {count} patients detected.")
    except Exception:
        print("Sync failed: Backend unreachable.")


# Head tracker — MediaPipe detection + Kalman filter + Hungarian assignment
tracker = HeadTracker(
    max_disappeared=30,    # ~1 s at 30 fps before a track is retired
    max_match_cost=0.55,   # blended IoU+distance threshold to accept a match
)


# Start lag-free camera stream
stream = CameraStream(1)

if not stream.isOpened():
    print("Error: Could not open laptop webcam.")
    sys.exit(1)

check_backend()
print("KlinikIQ Laptop Edge Node: Camera Counter Active...")
last_update_time = time.time()
person_count = 0
frame_idx = 0
last_boxes: list = []   # (x, y, w, h, track_id)

try:
    while True:
        ret, frame = stream.read()
        if not ret:
            continue

        display_frame = cv2.resize(frame, (640, 480))
        frame_idx += 1

        # Run head detection + tracking every N frames
        if frame_idx % DETECT_EVERY_N_FRAMES == 0:
            detect_frame = cv2.resize(frame, DETECT_RESIZE)
            tracked = tracker.update(detect_frame)

            # Scale tracked boxes back up to display (640×480) coords
            sx = 640 / DETECT_RESIZE[0]
            sy = 480 / DETECT_RESIZE[1]
            last_boxes = [
                (int(obj["box"][0]*sx), int(obj["box"][1]*sy),
                 int(obj["box"][2]*sx), int(obj["box"][3]*sy), oid)
                for oid, obj in tracked.items()
            ]
            person_count = tracker.count()

        for (x, y, w, h, oid) in last_boxes:
            cv2.rectangle(display_frame, (x, y), (x + w, y + h), (0, 220, 0), 2)
            cv2.putText(display_frame, f"#{oid}", (x, y - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 220, 0), 1)

        cv2.putText(display_frame, f"KlinikIQ Edge: {person_count} Patients", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.imshow('KlinikIQ - Laptop Edge Node [GQEBERHA]', display_frame)

        current_time = time.time()
        if current_time - last_update_time >= UPDATE_INTERVAL:
            url = f"{BACKEND_URL}/queue/update?count={person_count}"
            threading.Thread(target=send_update, args=(url, person_count), daemon=True).start()
            last_update_time = current_time

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

except KeyboardInterrupt:
    print("Stopping...")

finally:
    stream.release()
    cv2.destroyAllWindows()
