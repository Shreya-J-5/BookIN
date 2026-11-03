import asyncio
import json
import uuid
from typing import Dict, Set, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from strawberry.fastapi import GraphQLRouter

from app.core.config import settings
from app.database.init_db import create_all_tables
from app.database.connection import SessionLocal
from app.graphql.schema import schema
from app.graphql.context import get_context
from app.workers.tasks import async_reservation_sweeper
from app.services.payment_service import PaymentService
from app.integrations.razorpay import razorpay_client
from app.database.seed import seed_database


# WebSocket Connection Hub for real-time seat status synchronization
class ConnectionManager:
    def __init__(self):
        # Room per show_id: Dict[show_id_str, Set[WebSocket]]
        self.active_rooms: Dict[str, Set[WebSocket]] = {}

    async def connect(self, show_id: str, websocket: WebSocket):
        await websocket.accept()
        if show_id not in self.active_rooms:
            self.active_rooms[show_id] = set()
        self.active_rooms[show_id].add(websocket)

    def disconnect(self, show_id: str, websocket: WebSocket):
        if show_id in self.active_rooms:
            self.active_rooms[show_id].discard(websocket)
            if not self.active_rooms[show_id]:
                del self.active_rooms[show_id]

    async def broadcast_to_show(self, show_id: str, message: dict):
        if show_id in self.active_rooms:
            payload = json.dumps(message)
            disconnected = []
            for connection in self.active_rooms[show_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    disconnected.append(connection)
            for dead in disconnected:
                self.disconnect(show_id, dead)


ws_manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and background sweeper
    create_all_tables()
    sweeper_task = asyncio.create_task(async_reservation_sweeper())
    print("[BookIN FastAPI] Service initialized. Asynchronous reservation sweeper active.")
    yield
    # Shutdown
    sweeper_task.cancel()
    try:
        await sweeper_task
    except asyncio.CancelledError:
        pass
    print("[BookIN FastAPI] Service stopped.")


app = FastAPI(
    title="BookIN Movie Ticket Booking API",
    description="High-concurrency GraphQL API for discovery, interactive seat booking, and payment processing.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:80"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development & testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount GraphQL Router with Auth Context
graphql_app = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_app, prefix="/graphql")


# Real-time WebSocket endpoint for Show Seat Availability
@app.websocket("/ws/shows/{show_id}")
async def websocket_show_seats(websocket: WebSocket, show_id: str):
    await ws_manager.connect(show_id, websocket)
    try:
        # Acknowledge connection
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "showId": show_id,
            "message": "Connected to real-time seat synchronization room"
        })

        while True:
            # Listen for client messages (e.g. heartbeat or seat selection intents)
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
                action = data.get("action")
                if action == "SEAT_UPDATE":
                    # Broadcast seat change to other connected viewers
                    await ws_manager.broadcast_to_show(show_id, {
                        "type": "SEAT_STATUS_CHANGED",
                        "seatId": data.get("seatId"),
                        "status": data.get("status"),
                        "updatedBy": data.get("userId")
                    })
                elif action == "PING":
                    await websocket.send_json({"type": "PONG"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(show_id, websocket)


# REST Razorpay Webhook Handler
@app.post("/api/webhooks/razorpay")
async def razorpay_webhook(request: Request):
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")

    # In test/mock mode without configured webhook secret, accept payload
    if settings.RAZORPAY_WEBHOOK_SECRET and signature:
        is_valid = razorpay_client.verify_webhook_signature(raw_body, signature)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Razorpay webhook signature."
            )

    try:
        payload_data = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    db = SessionLocal()
    try:
        result = PaymentService.handle_webhook(db, payload_data)
        return JSONResponse(content=result)
    finally:
        db.close()


# REST Health Endpoint
@app.get("/health")
def health_check():
    db = SessionLocal()
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    finally:
        db.close()

    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database": db_status
    }


# REST Trigger for DB Seed (useful in automated tests / local setup)
@app.post("/api/seed")
def trigger_seed():
    seed_database()
    return {"message": "Database seeded successfully."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
