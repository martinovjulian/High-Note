from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.db import get_database_client
from bson.objectid import ObjectId
from app.routes.auth import get_current_user
from app.routes.auth import User


router = APIRouter()

class LobbyPayload(BaseModel):
    lobby_name: str
    description: Optional[str] = None
    user_count: int = 1  # Default to 1 for the creator


@router.post("/create-lobby")
async def create_lobby(
    payload: LobbyPayload,
    current_user: User = Depends(get_current_user),
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

    async with get_database_client() as client:
        db = client.notes_db
        lobby_data = {
            "lobby_name": payload.lobby_name,
            "created_by": current_user.username,  # Use the authenticated user's username
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
    current_user: User = Depends(get_current_user),
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    async with get_database_client() as client:
        db = client.notes_db
        lobbies_cursor = db.lobbies.find({})
        lobbies = await lobbies_cursor.to_list(length=None)

        return [
            {
                "lobby_id": str(lobby["_id"]),
                "lobby_name": lobby.get("lobby_name", ""),
                "description": lobby.get("description", ""),
                "user_count": lobby.get("user_count", 0),
                "created_by": lobby.get("created_by", ""),
                "created_at": lobby.get("created_at", "")
            }
            for lobby in lobbies
        ]

@router.put("/lobbies/{lobby_id}/increment-user-count")
async def increment_user_count(
    lobby_id: str,
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    async with get_database_client() as client:
        db = client.notes_db

        result = await db.lobbies.update_one(
            {"_id": ObjectId(lobby_id)},
            {"$inc": {"user_count": 1}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Lobby not found")

        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to increment user count")

        return {"message": "User count incremented successfully"}