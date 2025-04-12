from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.db import get_database_client

router = APIRouter()

class LobbyPayload(BaseModel):
    lobby_name: str
    created_by: Optional[str] = None

@router.post("/create-lobby")
async def create_lobby(
    payload: LobbyPayload,
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    db = db_client.notes_db
    lobby_data = {
        "lobby_name": payload.lobby_name,
        "created_by": payload.created_by,
        "created_at": datetime.utcnow()
    }
    result = await db.lobbies.insert_one(lobby_data)
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to create lobby")

    return {"message": "Lobby created successfully", "lobby_id": str(result.inserted_id)}

@router.get("/lobbies")
async def get_all_lobbies(
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    db = db_client.notes_db
    lobbies_cursor = db.lobbies.find({})
    lobbies = await lobbies_cursor.to_list(length=None)

    return [{"lobby_id": str(lobby["_id"]), "lobby_name": lobby["lobby_name"]} for lobby in lobbies]
