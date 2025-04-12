from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.db import get_database_client

router = APIRouter()

class LobbyPayload(BaseModel):
    lobby_name: str
    created_by: Optional[str] = None #save for later for user_auth
    description: Optional[str] = None
    user_count: int


@router.post("/create-lobby")
async def create_lobby(
    payload: LobbyPayload,
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    # Enforce a max word count for description (e.g., 50 words)
    if payload.description:
        word_count = len(payload.description.strip().split())
        if word_count > 50:
            raise HTTPException(
                status_code=400,
                detail=f"Description is too long ({word_count} words). Limit is 50 words."
            )

    db = db_client.notes_db
    lobby_data = {
        "lobby_name": payload.lobby_name,
        "created_by": payload.created_by,
        "description": payload.description,
        "user_count": payload.user_count,
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

from bson import ObjectId

@router.put("/lobbies/{lobby_id}/increment-user-count")
async def increment_user_count(
    lobby_id: str,
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    db = db_client.notes_db

    result = await db.lobbies.update_one(
        {"_id": ObjectId(lobby_id)},
        {"$inc": {"user_count": 1}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lobby not found")

    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to increment user count")

    return {"message": "User count incremented successfully"}