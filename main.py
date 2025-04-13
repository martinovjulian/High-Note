from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routes.routes import router as note_router
from app.routes.lobby import router as lobby_router
from app.routes.auth import router as auth_router, get_current_user
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Configure CORS to allow requests from both frontend development origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(note_router, prefix="/notes", tags=["notes"], dependencies=[Depends(get_current_user)])
app.include_router(lobby_router, prefix="/lobby", tags=["lobby"], dependencies=[Depends(get_current_user)])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
