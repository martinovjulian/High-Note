from fastapi import APIRouter, Depends, HTTPException, Body # Body might not be needed here
from pydantic import BaseModel # Import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from app.db import get_database_client
from app.extract import extract_key_concepts
# Assuming extract_key_concepts is defined elsewhere or remove if not used in this file
# from app.extract import extract_key_concepts

router = APIRouter()

# --- Define a Pydantic model for the request body ---
class NotePayload(BaseModel):
    user_id: str
    content: str
    class_id: str
# --- End Pydantic model definition ---

# Route that only submits a note
@router.post("/submit-note")
async def submit_note(
    payload: NotePayload,
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    db = db_client.notes_db
    # Include the submitted field set to True to denote final submission
    note_data = {
        "user_id": payload.user_id,
        "content": payload.content,
        "class_id": payload.class_id,
        "submitted": True  # New field to indicate the note has been submitted
    }
    result = await db.notes.insert_one(note_data)
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to submit note")
    return {"message": "Note submitted successfully", "id": str(result.inserted_id)}
# ... (rest of your routes remain the same) ...


# Separate route that retrieves notes for a given student and class,
# then performs RAKE to extract key concepts and uploads them to a document
# mapping the student (and optionally, the class) to these concepts.
@router.post("/update-student-concepts")
async def update_student_concepts(
    user_id: str,
    class_id: str,
    num_concepts: Optional[int] = 5,
    similarity_threshold: Optional[float] = 0.75,
    similarity_method: Optional[str] = "string",
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    db = db_client.notes_db
    # Retrieve all notes for the specified student and class
    notes_docs = await db.notes.find({"user_id": user_id, "class_id": class_id}).to_list(length=None)
    if not notes_docs:
        raise HTTPException(status_code=404, detail="No notes found for this student and class.")
    
    # Combine the content from all retrieved notes into a single text string
    aggregated_text = " ".join([doc["content"] for doc in notes_docs if "content" in doc])
    
    # Call extract_key_concepts positionally (to avoid any keyword argument issues)
    concepts = extract_key_concepts(aggregated_text, num_concepts, similarity_threshold, similarity_method)
    
    # Update or insert (upsert) the student's concepts in a dedicated collection (student_concepts)
    await db.student_concepts.update_one(
        {"user_id": user_id, "class_id": class_id},
        {"$set": {"concepts": concepts}},
        upsert=True
    )
    
    return {
        "message": "Student concepts updated successfully.",
        "user_id": user_id,
        "class_id": class_id,
        "concepts": concepts
    }

from sentence_transformers import SentenceTransformer, util

# Initialize the model once (reuse it across requests).
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

def find_common_concepts(student_concepts, other_concepts, sim_threshold=0.8):
    """
    Compare two lists of concept phrases semantically and return a list of common concepts
    based on a cosine similarity threshold.
    """
    common = set()
    
    # Generate embeddings for both lists of phrases
    student_embeddings = model.encode(student_concepts, convert_to_tensor=True)
    other_embeddings = model.encode(other_concepts, convert_to_tensor=True)
    
    # For each student concept, compute its similarity with all other concepts
    for idx, student_emb in enumerate(student_embeddings):
        # Compute cosine similarities between this student concept and all concepts from other students
        cosine_scores = util.cos_sim(student_emb, other_embeddings)
        # Check if any cosine similarity score exceeds our threshold
        if cosine_scores.max().item() >= sim_threshold:
            common.add(student_concepts[idx])
    
    return list(common)

# Example usage within your endpoint's logic
@router.get("/analyze-concepts-enhanced")
async def analyze_concepts_enhanced(
    user_id: str,
    class_id: str,
    num_concepts: Optional[int] = 10,
    similarity_threshold: Optional[float] = 0.75,
    similarity_method: Optional[str] = "string",  # might be unused with our semantic compare
    sim_threshold: float = 0.8,  # threshold for common concepts using semantic similarity
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    db = db_client.notes_db
    
    # Retrieve notes of other students
    other_notes_docs = await db.notes.find({
        "class_id": class_id,
        "user_id": {"$ne": user_id}
    }).to_list(length=None)
    
    # Retrieve notes of the given student
    student_notes_docs = await db.notes.find({
        "class_id": class_id,
        "user_id": user_id
    }).to_list(length=None)
    
    if not other_notes_docs:
        raise HTTPException(status_code=404, detail="No notes found from other students.")
    if not student_notes_docs:
        raise HTTPException(status_code=404, detail="No notes found for this student.")
    
    # Aggregate content
    aggregated_other_text = " ".join(doc["content"] for doc in other_notes_docs if "content" in doc)
    aggregated_student_text = " ".join(doc["content"] for doc in student_notes_docs if "content" in doc)
    
    # Use your existing RAKE function to extract concepts (using positional args to avoid keyword issues)
    other_concepts = extract_key_concepts(aggregated_other_text, num_concepts, similarity_threshold, similarity_method)
    student_concepts = extract_key_concepts(aggregated_student_text, num_concepts, similarity_threshold, similarity_method)
    
    # Now use the semantic approach to identify common concepts
    common_concepts = find_common_concepts(student_concepts, other_concepts, sim_threshold=sim_threshold)
    
    # Also compute missing and extra concepts for completeness (using string comparisons)
    missing_concepts = list(set(other_concepts) - set(student_concepts))
    extra_concepts = list(set(student_concepts) - set(other_concepts))
    
    return {
        "other_students_concepts": other_concepts,
        "student_concepts": student_concepts,
        "missing_concepts": missing_concepts,
        "extra_concepts": extra_concepts,
        "common_concepts": common_concepts
    }

# --- New Endpoint: Calculate Weight Percentage for Class Concepts ---
@router.get("/class-concepts-weight")
async def calculate_class_concept_weights(
    class_id: str,
    num_concepts: Optional[int] = 10,
    similarity_threshold: Optional[float] = 0.75,
    similarity_method: Optional[str] = "string",
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    db = db_client.notes_db
    # Retrieve all notes for the given class
    notes_docs = await db.notes.find({"class_id": class_id}).to_list(length=None)
    if not notes_docs:
        raise HTTPException(status_code=404, detail="No notes found for this class.")
    
    total_notes = len(notes_docs)
    concept_frequency = {}
    
    # Process each note individually to extract its key concepts
    for doc in notes_docs:
        if "content" in doc:
            # Extract concepts from the note's content using RAKE; adjust parameters as needed
            concepts = extract_key_concepts(doc["content"], num_concepts, similarity_threshold, similarity_method)
            # Ensure each concept is counted only once per note
            unique_concepts = set(concepts)
            for concept in unique_concepts:
                concept_frequency[concept] = concept_frequency.get(concept, 0) + 1
    
    # Compute weight percentage for each concept
    concept_weights = {}
    for concept, freq in concept_frequency.items():
        weight_percent = (freq / total_notes) * 100
        concept_weights[concept] = round(weight_percent, 2)
    
    return {
        "class_id": class_id,
        "total_notes": total_notes,
        "concept_weights": concept_weights
    }

@router.get("/get-student-notes")
async def get_student_notes(
    user_id: str,
    class_id: str,
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    db = db_client.notes_db
    notes = await db.notes.find({
        "user_id": user_id,
        "class_id": class_id
    }).to_list(length=None)
    
    if not notes:
        raise HTTPException(status_code=404, detail="No notes found for this student and class.")
    
    return {
        "notes": [note["content"] for note in notes if "content" in note]
    }

