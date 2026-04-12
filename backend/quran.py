import httpx
import os
import re
import html as html_module
from dotenv import load_dotenv

load_dotenv()

BASE      = "https://api.quran.com/api/v4"
AUDIO_CDN = "https://verses.quran.com/"

DEFAULT_RECITER_ID     = int(os.getenv("DEFAULT_RECITER_ID", "7"))
DEFAULT_TRANSLATION_ID = int(os.getenv("DEFAULT_TRANSLATION_ID", "20"))
DEFAULT_TAFSIR_ID      = int(os.getenv("DEFAULT_TAFSIR_ID", "817"))


def _clean(text: str) -> str:
    """Strip HTML tags, decode entities, normalise whitespace."""
    text = re.sub(r'<[^>]+>', '', text)
    text = html_module.unescape(text)
    return ' '.join(text.split())


async def get_audio_url(chapter: int, verse: int, reciter_id: int = DEFAULT_RECITER_ID) -> str:
    """GET /api/v4/recitations/{reciter_id}/by_ayah/{chapter}:{verse}"""
    url = f"{BASE}/recitations/{reciter_id}/by_ayah/{chapter}:{verse}"
    async with httpx.AsyncClient() as client:
        r = await client.get(url, timeout=10)
        r.raise_for_status()
        files = r.json().get("audio_files", [])
    if not files:
        raise ValueError(f"No audio for {chapter}:{verse} reciter {reciter_id}")
    return AUDIO_CDN + files[0]["url"]


async def get_tafsir(chapter: int, verse: int, tafsir_id: int = DEFAULT_TAFSIR_ID) -> tuple[str, str]:
    """
    GET /api/v4/tafsirs/{tafsir_id}/by_ayah/{chapter}:{verse}

    Ibn Kathir comments on verse ranges. Walk back up to 20 verses when the
    exact ayah returns no text.
    """
    async with httpx.AsyncClient() as client:
        for v in range(verse, max(0, verse - 20), -1):
            url = f"{BASE}/tafsirs/{tafsir_id}/by_ayah/{chapter}:{v}"
            r   = await client.get(url, timeout=10)
            r.raise_for_status()
            text = _clean(r.json().get("tafsir", {}).get("text", ""))
            if len(text) > 10:
                return text, f"{chapter}:{v}"

    return "No tafsir found for this section.", f"{chapter}:{verse}"


async def get_translation(chapter: int, verse: int, translation_id: int = DEFAULT_TRANSLATION_ID) -> tuple[str, str]:
    """
    GET /api/v4/translations/{translation_id}/by_ayah/{chapter}:{verse}
    Saheeh International = resource_id 20.
    """
    url = f"{BASE}/translations/{translation_id}/by_ayah/{chapter}:{verse}"
    async with httpx.AsyncClient() as client:
        r = await client.get(url, timeout=10)
        r.raise_for_status()
        translations = r.json().get("translations", [])
    if translations:
        text = _clean(translations[0].get("text", ""))
        if len(text) > 5:
            return text, f"{chapter}:{verse}"
    return "No translation available for this verse.", f"{chapter}:{verse}"


async def get_chapters() -> list:
    """GET /api/v4/chapters"""
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{BASE}/chapters", params={"language": "en"}, timeout=10)
        r.raise_for_status()
        return r.json()["chapters"]


async def get_chapter_info(chapter_id: int) -> dict:
    """GET /api/v4/chapters/{chapter_id}"""
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{BASE}/chapters/{chapter_id}", timeout=10)
        r.raise_for_status()
        return r.json()["chapter"]
