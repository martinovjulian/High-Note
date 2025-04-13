from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from pydantic import BaseModel # Import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from app.db import get_database_client
from app.extract import extract_key_concepts
import PyPDF2

# Assuming extract_key_concepts is defined elsewhere or remove if not used in this file
# from app.extract import extract_key_concepts

router = APIRouter()

# --- Define a Pydantic model for the request body ---
class NotePayload(BaseModel):
    user_id: str
    content: str
    class_id: str
# --- End Pydantic model definition ---

import io
import re

router = APIRouter()

@router.post("/submit-note")
async def submit_note(
    user_id: str = Form(...),
    content: str = Form(...),
    class_id: str = Form(...),
    pdf_file: Optional[UploadFile] = File(None),
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    # If a PDF file is provided, parse its text and use that as content
    if pdf_file:
        pdf_bytes = await pdf_file.read()
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        extracted_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + "\n"
        # Clean up the extracted text:
        # This replaces multiple whitespace characters (including newlines) with a single space.
        note_content = re.sub(r'\s+', ' ', extracted_text).strip()
    else:
        note_content = content

    async with get_database_client() as client:
        db = client.notes_db
        note_data = {
            "user_id": user_id,
            "content": note_content,
            "class_id": class_id
        }

        result = await db.notes.update_one(
            {"user_id": user_id, "class_id": class_id},
            {"$set": note_data},
            upsert=True
        )

        return {
            "message": "Note submitted or updated successfully",
            "modified_count": result.modified_count,
            "upserted_id": str(result.upserted_id) if result.upserted_id else None
        }


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
    # Use async with to properly retrieve the client from the async context manager
    async with db_client as client:
        db = client.notes_db
        # Retrieve all notes for the specified student and class
        notes_docs = await db.notes.find({"user_id": user_id, "class_id": class_id}).to_list(length=None)
        if not notes_docs:
            raise HTTPException(status_code=404, detail="No notes found for this student and class.")
        
        # Combine the content from all retrieved notes into a single text string
        aggregated_text = " ".join([doc["content"] for doc in notes_docs if "content" in doc])
        
        # Call extract_key_concepts positionally
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
    # Use the async context manager to get the actual client instance
    async with db_client as client:
        db = client.notes_db

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
    
        # Use your existing RAKE function to extract concepts using positional arguments
        other_concepts = extract_key_concepts(aggregated_other_text, num_concepts, similarity_threshold, similarity_method)
        student_concepts = extract_key_concepts(aggregated_student_text, num_concepts, similarity_threshold, similarity_method)
    
        # Identify common concepts using semantic similarity
        common_concepts = find_common_concepts(student_concepts, other_concepts, sim_threshold=sim_threshold)
    
        # Compute missing and extra concepts using simple set operations
        missing_concepts = list(set(other_concepts) - set(student_concepts))
        extra_concepts = list(set(student_concepts) - set(other_concepts))
    
        return {
            "other_students_concepts": other_concepts,
            "student_concepts": student_concepts,
            "missing_concepts": missing_concepts,
            "extra_concepts": extra_concepts,
            "common_concepts": common_concepts
        }



@router.get("/class-concepts-weight")
async def calculate_class_concept_weights(
    class_id: str,
    similarity_threshold: Optional[float] = 0.75,
    similarity_method: Optional[str] = "string",
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    # Use async with to obtain the database client instance
    async with db_client as client:
        db = client.notes_db
        
        # Retrieve all notes for the given class
        notes_docs = await db.notes.find({"class_id": class_id}).to_list(length=None)
        if not notes_docs:
            raise HTTPException(status_code=404, detail="No notes found for this class.")
        
        total_notes = len(notes_docs)
        concept_frequency = {}
        total_concept_mentions = 0  # To accumulate total mentions for normalization if needed
        
        # Process each note individually to extract its key concepts and count mentions
        for doc in notes_docs:
            if "content" in doc:
                note_content = doc["content"]
                # Extract concepts from the note's content using your extraction function.
                # Assume extract_key_concepts now returns a variable-length list based on relevance.
                # We do not pass a fixed number; alternatively, you could set a very high limit.
                concepts = extract_key_concepts(
                    note_content,
                    similarity_threshold=similarity_threshold,
                    similarity_method=similarity_method
                )
                
                # For each concept extracted, count how many times it appears in the note.
                for concept in concepts:
                    # Use a case-insensitive count
                    count = note_content.lower().count(concept.lower())
                    # Update the overall frequency for the concept.
                    concept_frequency[concept] = concept_frequency.get(concept, 0) + count
                    total_concept_mentions += count
        
        # Compute weight percentage for each concept
        # You could calculate the weight as a percentage of total concept mentions,
        # or, if you prefer, keep the raw counts.
        concept_weights = {}
        for concept, freq in concept_frequency.items():
            # Example 1: Normalize by total mentions so that the weights sum to 100%
            # weight_percent = (freq / total_concept_mentions) * 100
            
            # Example 2: Compute an average mentions per note percentage, if that makes more sense:
            weight_percent = (freq / total_notes)  # This is raw average mention count per note
            
            concept_weights[concept] = round(weight_percent, 2)
    
    return {
        "class_id": class_id,
        "total_notes": total_notes,
        "total_concept_mentions": total_concept_mentions,
        "concept_weights": concept_weights
    }



@router.get("/get-student-notes")
async def get_student_notes(
    user_id: str,
    class_id: str,
    db_client: AsyncIOMotorClient = Depends(get_database_client)
):
    async with get_database_client() as client:
        db = client.notes_db
        notes = await db.notes.find({
            "user_id": user_id,
            "class_id": class_id
        }).to_list(length=None)
        
        if not notes:
            raise HTTPException(status_code=404, detail="No notes found for this student and class.")
        
        return {
            "notes": [note["content"] for note in notes if "content" in note]
        }

