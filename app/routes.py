from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional
from app.db import get_database_client
from app.extract import extract_key_concepts

router = APIRouter()

class Note(BaseModel):
    user_id: str
    content: str
    class_id: str

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

@router.get("/key-concepts")
async def key_concepts(class_id: str,
                       num_concepts: Optional[int] = 5,
                       similarity_threshold: Optional[float] = 0.75,
                       similarity_method: Optional[str] = 'string',
                       db_client: AsyncIOMotorClient = Depends(get_database_client)):
    db = db_client.notes_db
    # Retrieve only notes corresponding to the provided class_id
    notes_docs = await db.notes.find({"class_id": class_id}).to_list(length=None)
    if not notes_docs:
        raise HTTPException(status_code=404, detail="No notes available for analysis for this class.")

    note_texts = [note["content"] for note in notes_docs if "content" in note]
    aggregated_text = " ".join(note_texts)

    key_concepts_list = extract_key_concepts(
        aggregated_text,
        num_concepts=num_concepts,
        threshold=similarity_threshold,
        similarity_method=similarity_method
    )
    return {"key_concepts": key_concepts_list}
