import httpx
import os
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN", "")
# Updated to new HF Inference Router endpoint (old api-inference.huggingface.co deprecated for this model)
HF_API_URL = "https://router.huggingface.co/hf-inference/models/openai/whisper-small"


async def transcribe_audio(audio_bytes: bytes) -> str:
    """
    Send raw audio bytes to HuggingFace Whisper-small inference API.
    Returns lowercase transcript string.

    NOTE: The frontend now uses the browser's native SpeechRecognition API
    for wake word detection. This endpoint is kept as a fallback only.
    """
    if not HF_TOKEN:
        raise ValueError("HF_TOKEN not set in environment.")

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "audio/webm",
    }

    import asyncio

    for attempt in range(3):
        async with httpx.AsyncClient() as client:
            try:
                r = await client.post(
                    HF_API_URL,
                    content=audio_bytes,
                    headers=headers,
                    timeout=30,
                )
                if r.status_code == 503:
                    # Model loading — wait and retry
                    await asyncio.sleep(5)
                    continue
                r.raise_for_status()
                result = r.json()
                return result.get("text", "").lower().strip()
            except httpx.RemoteProtocolError:
                # Incomplete response from HF — retry
                if attempt == 2:
                    raise
                await asyncio.sleep(2)

    return ""
