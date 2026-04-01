"""
head_tracker.py — Head detection + Kalman tracking for KlinikIQ Edge Node

Detection:  MediaPipe Face Detection (primary)
            Haar cascade frontal+profile (fallback if mediapipe not installed)

Tracking:   One Kalman filter per track predicts the head position every frame.
            Hungarian algorithm (scipy) gives optimal detection↔track assignment.
            A track survives `max_disappeared` consecutive missed frames before
            its ID is retired, so brief occlusions don't drop the count.

Install extras once:
    pip install mediapipe scipy
"""

import os
import urllib.request
import cv2
import numpy as np

# ---------------------------------------------------------------------------
# MediaPipe — supports both the legacy (< 0.10) and Tasks (>= 0.10) APIs
# ---------------------------------------------------------------------------
_MP_FACE        = None   # legacy FaceDetection context manager
_MP_TASK_DET    = None   # Tasks API FaceDetector object
_USE_MEDIAPIPE  = False

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "blaze_face_short_range.tflite")
_MODEL_URL  = (
    "https://storage.googleapis.com/mediapipe-models/"
    "face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite"
)

def _ensure_model():
    if not os.path.exists(_MODEL_PATH):
        print("[HeadTracker] Downloading face detection model (~800 KB)…")
        urllib.request.urlretrieve(_MODEL_URL, _MODEL_PATH)
        print("[HeadTracker] Model downloaded.")

try:
    import mediapipe as mp

    # ── Try legacy API first (mediapipe < 0.10) ──────────────────────────
    if hasattr(mp, "solutions") and hasattr(mp.solutions, "face_detection"):
        _MP_FACE = mp.solutions.face_detection.FaceDetection(
            model_selection=1, min_detection_confidence=0.5
        )
        _USE_MEDIAPIPE = True
        print("[HeadTracker] Using MediaPipe legacy API.")

    # ── Fall through to Tasks API (mediapipe >= 0.10) ────────────────────
    else:
        _ensure_model()
        BaseOptions        = mp.tasks.BaseOptions
        FaceDetector       = mp.tasks.vision.FaceDetector
        FaceDetectorOptions= mp.tasks.vision.FaceDetectorOptions
        VisionRunningMode  = mp.tasks.vision.RunningMode

        _MP_TASK_DET = FaceDetector.create_from_options(
            FaceDetectorOptions(
                base_options=BaseOptions(model_asset_path=_MODEL_PATH),
                running_mode=VisionRunningMode.IMAGE,
                min_detection_confidence=0.5,
            )
        )
        _USE_MEDIAPIPE = True
        print("[HeadTracker] Using MediaPipe Tasks API (0.10+).")

except Exception as _mp_err:
    print(f"[HeadTracker] MediaPipe unavailable ({_mp_err}). Using Haar cascade fallback.")

# ---------------------------------------------------------------------------
# Scipy Hungarian algorithm
# ---------------------------------------------------------------------------
try:
    from scipy.optimize import linear_sum_assignment
    _USE_HUNGARIAN = True
except ImportError:
    _USE_HUNGARIAN = False


# ---------------------------------------------------------------------------
# Per-track Kalman filter
# ---------------------------------------------------------------------------

class _KalmanTrack:
    """
    Tracks one head with an 8-state Kalman filter:
        state  = [x, y, w, h, vx, vy, vw, vh]
        measure= [x, y, w, h]
    where (x, y) is the top-left corner and (w, h) is the box size.
    """

    def __init__(self, box: tuple):
        kf = cv2.KalmanFilter(8, 4)

        # Measurement picks out the first 4 state components
        kf.measurementMatrix = np.eye(4, 8, dtype=np.float32)

        # Constant-velocity motion model: x_new = x + vx, etc.
        kf.transitionMatrix = np.eye(8, dtype=np.float32)
        for i in range(4):
            kf.transitionMatrix[i, i + 4] = 1.0

        kf.processNoiseCov     = np.eye(8, dtype=np.float32) * 0.03
        kf.measurementNoiseCov = np.eye(4, dtype=np.float32) * 5.0
        kf.errorCovPost        = np.eye(8, dtype=np.float32) * 50.0

        x, y, w, h = box
        kf.statePost = np.array(
            [x, y, w, h, 0, 0, 0, 0], dtype=np.float32
        ).reshape(-1, 1)

        self.kf = kf
        self.box = box
        self.disappeared = 0

    # predicted box (called every frame before matching)
    def predict(self) -> tuple:
        pred = self.kf.predict()
        x, y, w, h = pred[:4].flatten()
        self.box = (max(0, int(x)), max(0, int(y)), max(8, int(w)), max(8, int(h)))
        return self.box

    # called when a detection is successfully matched to this track
    def correct(self, box: tuple) -> None:
        x, y, w, h = box
        self.kf.correct(
            np.array([x, y, w, h], dtype=np.float32).reshape(-1, 1)
        )
        self.box = box
        self.disappeared = 0

    @property
    def centroid(self) -> tuple:
        x, y, w, h = self.box
        return (x + w // 2, y + h // 2)


# ---------------------------------------------------------------------------
# Main tracker class
# ---------------------------------------------------------------------------

class HeadTracker:
    """
    Public API (unchanged from previous version):

        tracker = HeadTracker()
        objects = tracker.update(frame)   # dict {id: {"box", "centroid", "disappeared"}}
        n       = tracker.count()
    """

    def __init__(
        self,
        max_disappeared: int = 30,
        max_match_cost:  float = 0.55,   # above this blended cost, refuse to match
        iou_weight:      float = 0.55,   # weight given to IoU component of cost
        dist_weight:     float = 0.45,   # weight given to normalised distance
    ):
        self.next_id        = 0
        self.tracks: dict[int, _KalmanTrack] = {}
        self.max_disappeared = max_disappeared
        self.max_match_cost  = max_match_cost
        self.iou_weight      = iou_weight
        self.dist_weight     = dist_weight

        # Haar cascade fallback
        self._frontal = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        self._profile = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_profileface.xml"
        )

        if _USE_MEDIAPIPE:
            print("[HeadTracker] Using MediaPipe face detection.")
        else:
            print("[HeadTracker] mediapipe not found — using Haar cascade fallback.")
        if _USE_HUNGARIAN:
            print("[HeadTracker] Using Hungarian algorithm for optimal assignment.")
        else:
            print("[HeadTracker] scipy not found — using greedy matching fallback.")

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    def update(self, frame: np.ndarray) -> dict:
        detections = self._detect(frame)

        # Step 1: predict all tracks forward one frame
        for track in self.tracks.values():
            track.predict()

        # Step 2: match detections to predicted tracks
        self._assign(detections, frame.shape)

        # Step 3: return live tracks as a plain dict (same schema as before)
        return {
            oid: {
                "box":        t.box,
                "centroid":   t.centroid,
                "disappeared": t.disappeared,
            }
            for oid, t in self.tracks.items()
        }

    def count(self) -> int:
        return len(self.tracks)

    # ------------------------------------------------------------------
    # Detection
    # ------------------------------------------------------------------

    def _detect(self, frame: np.ndarray) -> list[tuple]:
        if _USE_MEDIAPIPE:
            return self._detect_mediapipe(frame)
        return self._detect_haar(frame)

    def _detect_mediapipe(self, frame: np.ndarray) -> list[tuple]:
        h, w = frame.shape[:2]
        boxes: list[tuple] = []

        if _MP_FACE is not None:
            # Legacy API
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res = _MP_FACE.process(rgb)
            detections = res.detections or []
        else:
            # Tasks API (mediapipe >= 0.10)
            import mediapipe as mp
            mp_img = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            )
            detections = _MP_TASK_DET.detect(mp_img).detections or []

        for det in detections:
            if hasattr(det, "bounding_box"):
                # Tasks API (>= 0.10): pixel coordinates directly
                bb = det.bounding_box
                bx, by, bw, bh = bb.origin_x, bb.origin_y, bb.width, bb.height
            else:
                # Legacy API (< 0.10): relative coordinates
                bb = det.location_data.relative_bounding_box
                bx = int(bb.xmin * w)
                by = int(bb.ymin * h)
                bw = int(bb.width  * w)
                bh = int(bb.height * h)
            bx = max(0, bx)
            by = max(0, by)
            if bw > 0 and bh > 0:
                boxes.append((bx, by, bw, bh))
        return boxes

    def _detect_haar(self, frame: np.ndarray) -> list[tuple]:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        frontal = self._frontal.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=4, minSize=(28, 28)
        )
        profile = self._profile.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=4, minSize=(28, 28)
        )
        boxes: list[tuple] = [tuple(b) for b in frontal] if len(frontal) else []
        for pb in ([tuple(b) for b in profile] if len(profile) else []):
            if not any(self._iou(pb, fb) > 0.35 for fb in boxes):
                boxes.append(pb)
        return boxes

    # ------------------------------------------------------------------
    # Assignment
    # ------------------------------------------------------------------

    def _assign(self, detections: list[tuple], frame_shape: tuple) -> None:
        if not detections:
            for oid in list(self.tracks):
                self.tracks[oid].disappeared += 1
                if self.tracks[oid].disappeared > self.max_disappeared:
                    del self.tracks[oid]
            return

        if not self.tracks:
            for box in detections:
                self._register(box)
            return

        track_ids = list(self.tracks)
        fh, fw    = frame_shape[:2]
        diag      = np.sqrt(fw ** 2 + fh ** 2)  # normalise distances

        # Build cost matrix
        n_t = len(track_ids)
        n_d = len(detections)
        cost = np.full((n_t, n_d), fill_value=1.0, dtype=np.float32)

        for i, tid in enumerate(track_ids):
            t_box = self.tracks[tid].box
            t_c   = self.tracks[tid].centroid
            for j, d_box in enumerate(detections):
                dcx = d_box[0] + d_box[2] // 2
                dcy = d_box[1] + d_box[3] // 2
                norm_dist  = np.hypot(t_c[0] - dcx, t_c[1] - dcy) / diag
                iou_cost   = 1.0 - self._iou(t_box, d_box)
                cost[i, j] = self.iou_weight * iou_cost + self.dist_weight * norm_dist

        # Optimal or greedy assignment
        if _USE_HUNGARIAN:
            row_ind, col_ind = linear_sum_assignment(cost)
            pairs = list(zip(row_ind, col_ind))
        else:
            pairs = sorted(
                ((i, j) for i in range(n_t) for j in range(n_d)),
                key=lambda p: cost[p[0], p[1]]
            )

        matched_t: set = set()
        matched_d: set = set()

        for i, j in pairs:
            if i in matched_t or j in matched_d:
                continue
            if cost[i, j] > self.max_match_cost:
                continue
            self.tracks[track_ids[i]].correct(detections[j])
            matched_t.add(i)
            matched_d.add(j)

        # Age unmatched tracks
        for i, tid in enumerate(track_ids):
            if i not in matched_t:
                self.tracks[tid].disappeared += 1
                if self.tracks[tid].disappeared > self.max_disappeared:
                    del self.tracks[tid]

        # New tracks for unmatched detections
        for j, box in enumerate(detections):
            if j not in matched_d:
                self._register(box)

    def _register(self, box: tuple) -> None:
        self.tracks[self.next_id] = _KalmanTrack(box)
        self.next_id += 1

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _iou(a: tuple, b: tuple) -> float:
        ax, ay, aw, ah = a
        bx, by, bw, bh = b
        ix = max(ax, bx);  iy = max(ay, by)
        iw = min(ax + aw, bx + bw) - ix
        ih = min(ay + ah, by + bh) - iy
        if iw <= 0 or ih <= 0:
            return 0.0
        inter = iw * ih
        return inter / (aw * ah + bw * bh - inter)
