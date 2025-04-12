import os
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import HTTPException

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

def get_database_client() -> AsyncIOMotorClient:
    return AsyncIOMotorClient(MONGODB_URL)

async def fetch_all_notes(db_client: AsyncIOMotorClient):
    try:
        db = db_client.notes_db
        cursor = db.notes.find({})
        return await cursor.to_list(length=None)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch notes from the database.")
