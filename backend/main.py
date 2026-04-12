from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from intent import classify_intent
from quran import get_audio_url, get_tafsir, get_translation, get_chapters, get_chapter_info
from stt import transcribe_audio

load_dotenv()

app = FastAPI(title="Huda API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class IntentRequest(BaseModel):
    transcript: str
    chapter: int
    verse: int


@app.get("/")
def root():
    return {"status": "Huda API running"}


@app.post("/api/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    """Receive audio blob, return transcript via HuggingFace Whisper."""
    audio_bytes = await audio.read()
    transcript = await transcribe_audio(audio_bytes)
    return {"transcript": transcript}


@app.post("/api/intent")
def intent(req: IntentRequest):
    """Classify transcript into a structured intent."""
    result = classify_intent(req.transcript, req.chapter, req.verse)
    return result


@app.get("/api/audio")
async def audio(chapter: int, verse: int, reciter: int = 7):
    """Fetch audio URL for a given chapter:verse from Quran Foundation API."""
    try:
        url = await get_audio_url(chapter, verse, reciter)
        return {"audio_url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tafsir")
async def tafsir(chapter: int, verse: int, tafsir_id: int = 817):
    """Fetch tafsir text for a given verse.
    If no tafsir exists for that exact verse, returns the covering commentary
    from an earlier verse (classical tafsirs group ranges of verses together).
    """
    try:
        text, found_verse_key = await get_tafsir(chapter, verse, tafsir_id)
        return {"text": text, "verse_key": found_verse_key, "requested_verse_key": f"{chapter}:{verse}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/translation")
async def translation(chapter: int, verse: int, translation_id: int = 20):
    """Fetch English translation for a given verse.
    If the exact verse returns empty (e.g. footnote-only HTML), falls back to
    the nearest preceding verse with real content.
    """
    try:
        text, found_verse_key = await get_translation(chapter, verse, translation_id)
        return {"text": text, "verse_key": found_verse_key, "requested_verse_key": f"{chapter}:{verse}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/chapters")
async def chapters():
    """Fetch full list of 114 chapters."""
    try:
        data = await get_chapters()
        return {"chapters": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/chapter/{chapter_id}")
async def chapter_info(chapter_id: int):
    """Fetch metadata for a single chapter."""
    try:
        data = await get_chapter_info(chapter_id)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
