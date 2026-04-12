import re

# ---------------------------------------------------------------------------
# Rule-based intent classifier
# No external model or API required.
# ---------------------------------------------------------------------------

INTENTS = {
    "GET_TAFSIR": "GET_TAFSIR",
    "GET_TRANSLATION": "GET_TRANSLATION",
    "NAVIGATE_CHAPTER": "NAVIGATE_CHAPTER",
    "NAVIGATE_VERSE": "NAVIGATE_VERSE",
    "PLAYBACK_PAUSE": "PLAYBACK_PAUSE",
    "PLAYBACK_RESUME": "PLAYBACK_RESUME",
    "PLAYBACK_NEXT": "PLAYBACK_NEXT",
    "PLAYBACK_PREVIOUS": "PLAYBACK_PREVIOUS",
    "PLAYBACK_REPEAT": "PLAYBACK_REPEAT",
    "UNKNOWN": "UNKNOWN",
}

# Chapter name → ID mapping (common names users might say)
CHAPTER_NAME_MAP = {
    "fatiha": 1, "fatihah": 1, "al-fatiha": 1, "opener": 1,
    "baqarah": 2, "al-baqarah": 2, "cow": 2,
    "imran": 3, "ali imran": 3,
    "nisa": 4, "an-nisa": 4, "women": 4,
    "maidah": 5, "al-maidah": 5,
    "anam": 6, "al-anam": 6,
    "kahf": 18, "al-kahf": 18, "cave": 18,
    "maryam": 19, "mary": 19,
    "yasin": 36, "ya-sin": 36, "ya sin": 36,
    "rahman": 55, "ar-rahman": 55,
    "waqiah": 56, "al-waqiah": 56,
    "mulk": 67, "al-mulk": 67,
    "ikhlas": 112, "al-ikhlas": 112, "sincerity": 112,
    "falaq": 113, "al-falaq": 113,
    "nas": 114, "an-nas": 114, "mankind": 114,
}


def _is_previous(t: str) -> bool:
    return any(w in t for w in ["previous", "last", "before", "prior"])


def classify_intent(transcript: str, chapter: int, verse: int) -> dict:
    t = transcript.lower().strip()

    # --- Remove wake word prefix if present ---
    for wake in ["hey huda", "ya huda", "huda"]:
        t = t.replace(wake, "").strip()

    # --- TAFSIR ---
    tafsir_keywords = ["tafsir", "explain", "explanation", "what does this mean",
                       "what does it mean", "meaning", "interpret", "commentary"]
    if any(kw in t for kw in tafsir_keywords):
        offset = -1 if _is_previous(t) else 0
        return {
            "intent": INTENTS["GET_TAFSIR"],
            "params": {"verse_offset": offset},
        }

    # --- TRANSLATION ---
    translation_keywords = ["translat", "in english", "english translation",
                            "what does", "what is it saying", "what does this say"]
    if any(kw in t for kw in translation_keywords):
        offset = -1 if _is_previous(t) else 0
        return {
            "intent": INTENTS["GET_TRANSLATION"],
            "params": {"verse_offset": offset},
        }

    # --- NAVIGATE CHAPTER by number ---
    chapter_num_match = re.search(r'chapter\s+(\d+)|surah\s+(\d+)', t)
    if chapter_num_match:
        num = int(chapter_num_match.group(1) or chapter_num_match.group(2))
        if 1 <= num <= 114:
            return {
                "intent": INTENTS["NAVIGATE_CHAPTER"],
                "params": {"chapter_id": num, "verse_id": 1},
            }

    # --- NAVIGATE CHAPTER by name ---
    for name, cid in CHAPTER_NAME_MAP.items():
        if name in t:
            return {
                "intent": INTENTS["NAVIGATE_CHAPTER"],
                "params": {"chapter_id": cid, "verse_id": 1},
            }

    # --- NAVIGATE VERSE by number ---
    verse_match = re.search(r'verse\s+(\d+)|ayah\s+(\d+)|ayat\s+(\d+)|to\s+(\d+)', t)
    if verse_match:
        groups = verse_match.groups()
        num = next(int(g) for g in groups if g is not None)
        return {
            "intent": INTENTS["NAVIGATE_VERSE"],
            "params": {"verse_id": num},
        }

    # --- PLAYBACK CONTROL ---
    if any(w in t for w in ["pause", "stop", "halt"]):
        return {"intent": INTENTS["PLAYBACK_PAUSE"], "params": {}}

    if any(w in t for w in ["resume", "continue", "unpause", "start"]):
        return {"intent": INTENTS["PLAYBACK_RESUME"], "params": {}}

    if "next" in t:
        return {"intent": INTENTS["PLAYBACK_NEXT"], "params": {}}

    if any(w in t for w in ["previous verse", "go back", "back"]):
        return {"intent": INTENTS["PLAYBACK_PREVIOUS"], "params": {}}

    if any(w in t for w in ["repeat", "again", "replay"]):
        return {"intent": INTENTS["PLAYBACK_REPEAT"], "params": {}}

    # --- UNKNOWN ---
    return {"intent": INTENTS["UNKNOWN"], "params": {}}
