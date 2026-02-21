from fastapi import APIRouter, UploadFile, File
import os
from services.audio_engine import BassExtractor

router = APIRouter()

@router.post("/process")
async def process(file: UploadFile = File(...)):
    os.makedirs("temp", exist_ok=True)
    file_path = f"temp/{file.filename}"
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    engine = BassExtractor(file_path)
    bpm, midi = engine.process_pipeline()
    engine.cleanup()
    
    return {"bpm": bpm, "midi": midi}
