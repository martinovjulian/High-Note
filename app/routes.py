from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional
from app.db import get_database_client, fetch_all_notes

router = APIRouter()

class Note(BaseModel):
    user_id: str
    content: str

@router.post("/submit-note")
async def submit_note(note: Note, db_client: AsyncIOMotorClient = Depends(get_database_client)):
    try:
        note_data = note.dict()
        db = db_client.notes_db
        result = await db.notes.insert_one(note_data)
        if result.inserted_id:
            return {"message": "Note submitted successfully", "id": str(result.inserted_id)}
        else:
            raise HTTPException(status_code=500, detail="Failed to submit note")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
