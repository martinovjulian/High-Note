from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router as note_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(note_router)
