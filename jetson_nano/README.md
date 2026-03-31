# KlinikIQ Jetson Nano Edge Setup

This folder contains the optimized edge AI script for a **Jetson Nano** using a **Raspberry Pi Camera (CSI)**.

## 1. Setup on Jetson Nano
Ensure you have the following installed on your Jetson Nano:
```bash
sudo apt-get update
sudo apt-get install python3-opencv python3-requests
```

## 2. Configuration
Open `jetson_edge.py` and update the `BACKEND_URL` to point to your central server's IP address:
```python
BACKEND_URL = "http://192.168.x.x:8000" 
```

## 3. Running the Node
Run the script to start monitoring:
```bash
python3 jetson_edge.py
```

## Troubleshooting
- **CSI Camera Fail:** Ensure the ribbon cable is inserted correctly (blue tab facing away from the board on the Pi Cam, and facing the heatsink on the Nano).
- **Backend Sync Fail:** Verify your Jetson and the Backend are on the same Wi-Fi network and that the server's firewall allows traffic on port 8000.
