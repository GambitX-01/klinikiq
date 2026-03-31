from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import datetime
import random
import time
import asyncio
from twilio.twiml.messaging_response import MessagingResponse

app = FastAPI(title="KlinikIQ API", version="1.1.0")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mock Database ---
state = {
    "clinic_id": "HQ-MAHIKENG-01",
    "patient_count": 22,
    "inventory": [
        {"id": "INS-S2", "name": "Insulin (Human)", "level": 25, "status": "CRITICAL"},
        {"id": "ARV-TR", "name": "ARV (Tenofovir)", "level": 85, "status": "STABLE"},
        {"id": "ANL-S1", "name": "Painkillers", "level": 55, "status": "MONITORING"}
    ],
    "logs": ["[SYS] Agentic AI Initialization Complete", "[DB] Linked to Mahikeng Central Node"]
}

# --- Agentic AI Logic ---
class RestockAgent:
    def __init__(self):
        self.is_running = False

    async def run_reasoning(self, item_name: str):
        # Mock multi-step reasoning process
        log_entry(f"[AGENT] Analyzing stock trend for {item_name}...")
        await asyncio.sleep(1)
        log_entry(f"[AGENT] Low stock confirmed. Checking district pharmacy availability...")
        await asyncio.sleep(1)
        log_entry(f"[AGENT] District pharmacy has surplus. Generating restocking request...")
        await asyncio.sleep(1)
        log_entry(f"[AGENT] RESTOCK TRIGGERED: 100 units of {item_name} requested.")

agent = RestockAgent()

def log_entry(msg: str):
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    state["logs"].insert(0, f"[{timestamp}] {msg}")
    if len(state["logs"]) > 6:
        state["logs"].pop()

# --- API Endpoints ---

@app.get("/")
async def root():
    return {"message": "KlinikIQ API is running", "version": "1.1.0"}

@app.post("/queue/update")
async def update_queue(count: int = Query(...)):
    state["patient_count"] = count
    log_entry(f"[EDGE] Camera feed update: {count} patients detected")
    return {"status": "success", "new_count": count}

@app.get("/status")
async def get_status():
    # Return current state (patient count is now managed by external Edge AI)
    return state

@app.post("/trigger-restock/{item_id}")
async def trigger_restock(item_id: str, background_tasks: BackgroundTasks):
    item = next((i for i in state["inventory"] if i["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    background_tasks.add_task(agent.run_reasoning, item["name"])
    return {"status": "Agent deployed", "item": item["name"]}

@app.get("/predict/wait-time")
async def predict_wait():
    # Placeholder for scikit-learn model
    wait_time = state["patient_count"] * 3.5
    return {"wait_minutes": int(wait_time)}

# --- WhatsApp Integration ---

@app.post("/whatsapp")
async def whatsapp_webhook(Body: str = Form(...), From: str = Form(...)):
    """
    Webhook for WhatsApp messages.
    Patients can text 'status', 'wait', or 'hello' to get clinic info.
    """
    incoming_msg = Body.lower().strip()
    resp = MessagingResponse()
    msg = resp.message()

    if "status" in incoming_msg or "how busy" in incoming_msg:
        count = state["patient_count"]
        capacity = 40
        occupancy = int((count / capacity) * 100) if count > 0 else 0
        status_text = "🟢 Calm" if occupancy < 40 else "🟡 Moderate" if occupancy < 80 else "🔴 Very Busy"
        
        response_text = (
            f"🏥 *KlinikIQ Status Report*\n\n"
            f"📍 *Clinic:* {state['clinic_id']}\n"
            f"👥 *Active Patients:* {count}\n"
            f"📊 *Occupancy:* {occupancy}%\n"
            f"🚦 *Current Pace:* {status_text}\n\n"
            f"Type 'wait' to get estimated wait time."
        )
        msg.body(response_text)

    elif "wait" in incoming_msg or "time" in incoming_msg:
        wait_min = int(state["patient_count"] * 3.5)
        response_text = (
            f"⏳ *Estimated Wait Time*\n\n"
            f"The current estimated wait time at *{state['clinic_id']}* is approximately *{wait_min} minutes*.\n\n"
            f"Stay safe!"
        )
        msg.body(response_text)

    else:
        response_text = (
            f"👋 Welcome to *KlinikIQ Smart Clinic Assistant*!\n\n"
            f"I can help you check how busy the clinic is before you visit.\n\n"
            f"Reply with:\n"
            f"👉 *'status'* - To see current occupancy\n"
            f"👉 *'wait'* - To get estimated wait time"
        )
        msg.body(response_text)

    return Response(content=str(resp), media_type="application/xml")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
