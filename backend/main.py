import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router

# Ensure temp directory exists at startup
os.makedirs("temp", exist_ok=True)

app = FastAPI(title="Bass Trap API")

# Setup CORS — tighten ALLOWED_ORIGINS via env var in production
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Bass Trap API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}