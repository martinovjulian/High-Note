import os
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import HTTPException
from contextlib import asynccontextmanager

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

# Create a single client instance
client = AsyncIOMotorClient(MONGODB_URL)

@asynccontextmanager
async def get_database_client():
    try:
        # Initialize auth_db indexes if they don't exist
        await client.auth_db.users.create_index("username", unique=True)
        await client.auth_db.users.create_index("email", unique=True)
        
        # Initialize notes_db indexes if they don't exist
        await client.notes_db.notes.create_index("title")
        await client.notes_db.notes.create_index("created_at")
        await client.notes_db.notes.create_index("user_id")
        
        yield client
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

async def fetch_all_notes(db_client: AsyncIOMotorClient):
    try:
        db = db_client.notes_db
        cursor = db.notes.find({})
        return await cursor.to_list(length=None)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch notes from the database.")
